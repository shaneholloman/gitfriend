import { getOctokit } from "@/lib/octokit"
import { redis, CACHE_TTL } from "@/lib/redis"
import { type NextRequest, NextResponse } from "next/server"

// Simple in-process request coalescing by repo key to avoid thundering herd
const inFlight = new Map<string, Promise<any>>()

// Minimal per-IP limiter (in-memory). If you need stronger guarantees, move to Redis incr.
type Count = { count: number; windowStart: number }
const ipWindow = new Map<string, Count>()
const WINDOW_MS = 15_000
const MAX_REQS = 12 // per 15s per IP for this route

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || (req as any).ip || "unknown"
}

function rateLimited(ip: string) {
  const now = Date.now()
  const data = ipWindow.get(ip)
  if (!data) {
    ipWindow.set(ip, { count: 1, windowStart: now })
    return false
  }
  if (now - data.windowStart > WINDOW_MS) {
    ipWindow.set(ip, { count: 1, windowStart: now })
    return false
  }
  data.count += 1
  if (data.count > MAX_REQS) return true
  return false
}

function parseRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)(?:\.git)?/i)
  if (!match) return null
  return { owner: match[1], repo: match[2] }
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "15" } },
    )
  }

  try {
    const { repoUrl } = await req.json()
    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json({ error: "repoUrl required" }, { status: 400 })
    }

    const parsed = parseRepoUrl(repoUrl)
    if (!parsed) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
    }
    const { owner, repo } = parsed
    const cacheKey = `repo-data:${owner}/${repo}`

    // 1) Return from cache if available
    const cached = await redis.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: { "X-Cache": "HIT" },
      })
    }

    // 2) Coalesce concurrent requests for same repo
    if (inFlight.has(cacheKey)) {
      try {
        const result = await inFlight.get(cacheKey)!
        return NextResponse.json(result, {
          status: 200,
          headers: { "X-Cache": "COALESCE" },
        })
      } catch (e: any) {
        // fallthrough to a safe error response
      }
    }

    const promise = (async () => {
      const octokit = getOctokit()

      // Fetch core repo info with conservative sequential requests
      const { data: repoData } = await octokit.repos.get({ owner, repo })

      // Keep the request surface small to avoid abuse checks; fetch content root list and languages only
      const [{ data: contents }, { data: languages }] = await Promise.all([
        octokit.repos.getContent({ owner, repo, path: "" }),
        octokit.repos.listLanguages({ owner, repo }),
      ])

      const files = Array.isArray(contents) ? contents.map((f: any) => ({ name: f.name, type: f.type })) : []

      const payload = {
        name: repoData.name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        languages,
        files,
        updatedAt: repoData.updated_at,
        owner,
        repo,
        html_url: repoData.html_url,
      }

      // Cache for 10 minutes to avoid repeated GitHub hits
      await redis.set(cacheKey, payload, { ex: Math.min(CACHE_TTL.STATUS, 10 * 60) })
      return payload
    })()

    inFlight.set(cacheKey, promise)

    let payload: any
    try {
      payload = await promise
    } finally {
      inFlight.delete(cacheKey)
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: { "X-Cache": "MISS" },
    })
  } catch (error: any) {
    const message = String(error?.message || "")
    const isAbuse =
      error?.status === 403 &&
      (message.includes("abuse") ||
        message.includes("secondary rate limit") ||
        message.includes("Please wait a few minutes"))

    if (isAbuse) {
      // Back off client to stop loops
      return NextResponse.json(
        {
          error: "GitHub abuse detection triggered. Please wait and try again.",
          details: message,
        },
        { status: 429, headers: { "Retry-After": "60" } },
      )
    }

    console.error("[fetch-repo-data] Unexpected error:", error)
    return NextResponse.json({ error: "Failed to fetch repository data", details: message }, { status: 500 })
  }
}
