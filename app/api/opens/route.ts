import { type NextRequest, NextResponse } from "next/server"
import { getOctokit } from "@/lib/octokit"
import { redis } from "@/lib/redis"

function parseParams(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q") || ""
  const language = url.searchParams.get("language") || "all"
  const difficulty = url.searchParams.get("difficulty") || "all"
  const sort = url.searchParams.get("sort") || "popular"
  const order = (url.searchParams.get("order") || "desc") as "asc" | "desc"
  const per_page = Number(url.searchParams.get("per_page") || 20)
  const page = Number(url.searchParams.get("page") || 1)
  return { q, language, difficulty, sort, order, per_page, page }
}

function buildGithubQuery(q: string, language: string) {
  const parts: string[] = []
  if (q) parts.push(q)
  if (language && language !== "all") parts.push(`language:${language}`)
  parts.push("is:public")
  parts.push("archived:false")
  return parts.join(" ")
}

function mapSort(sort: string): { sort?: "stars" | "updated" | "help-wanted-issues"; order?: "asc" | "desc" } {
  switch (sort) {
    case "popular":
      return { sort: "stars", order: "desc" }
    case "growing":
      // proxy via updated as a simple signal of velocity
      return { sort: "updated", order: "desc" }
    case "new":
      return { sort: "updated", order: "desc" }
    case "old":
      return { sort: "updated", order: "asc" }
    default:
      return { sort: "stars", order: "desc" }
  }
}

export async function GET(req: NextRequest) {
  const { q, language, sort, order, per_page, page } = parseParams(req)
  const query = buildGithubQuery(q, language)
  const sortMap = mapSort(sort)

  const cacheKey = `opens:search:${query}:${sortMap.sort}:${order}:${per_page}:${page}`
  const cached = await redis.get<any>(cacheKey)
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } })
  }

  try {
    const octokit = getOctokit()
    const res = await octokit.search.repos({
      q: query,
      sort: sortMap.sort,
      order: sortMap.order ?? order,
      per_page,
      page,
    })

    const items = res.data.items.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      html_url: r.html_url,
      language: r.language,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      topics: (r.topics as string[]) ?? [],
      owner: r.owner?.login,
      avatar_url: r.owner?.avatar_url,
      description: r.description,
    }))

    const end = items.length < per_page
    const payload = { items, end }
    await redis.set(cacheKey, payload, { ex: 60 }) // short TTL since search is dynamic
    return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } })
  } catch (error: any) {
    const msg = String(error?.message || "")
    const isAbuse =
      error?.status === 403 &&
      (msg.includes("abuse") || msg.includes("secondary rate limit") || msg.includes("Please wait"))

    if (isAbuse) {
      return NextResponse.json(
        { error: "GitHub abuse detection triggered. Please wait and try again." },
        { status: 429, headers: { "Retry-After": "60" } },
      )
    }

    console.error("[opens/search] error:", error)
    return NextResponse.json({ error: "Failed to search repositories" }, { status: 500 })
  }
}
