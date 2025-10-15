import { type NextRequest, NextResponse } from "next/server"
import { createOctokit } from "@/lib/github"
import { redis } from "@/lib/redis"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  stargazers_count: number
  forks_count: number
  topics: string[]
  html_url: string
  owner: {
    login: string
    avatar_url: string
  }
  updated_at: string
}

// Function to fetch trending repositories based on a given period in days
async function fetchTrending(octokit: ReturnType<typeof createOctokit>, periodDays: number) {
  const sinceDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data } = await octokit.search.repos({
    q: `is:public created:>=${sinceDate} stars:>5`,
    sort: "stars",
    order: "desc",
    per_page: 50,
  })
  return data.items
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const language = searchParams.get("language") || ""
    const minStars = searchParams.get("minStars") || ""
    const sortBy = searchParams.get("sortBy") || "stars"
    const trending = searchParams.get("trending") // "1" to force trending mode
    const trendingPeriod = (searchParams.get("trendingPeriod") || "day") as "day" | "month" | "year"

    const periodDays = trendingPeriod === "day" ? 1 : trendingPeriod === "month" ? 30 : 365

    // Include trending in cache key
    const cacheKey =
      trending === "1"
        ? `opensource:trending:${trendingPeriod}:${sortBy}`
        : `opensource:${search || "default"}:${language || "all"}:${minStars || "any"}:${sortBy}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return NextResponse.json({ repositories: cached })
      }
    } catch (error) {
      console.warn("Redis cache miss or error:", error)
    }

    const octokit = createOctokit()
    let repositories: Repository[] = []

    // Trending takes precedence when requested
    if (trending === "1") {
      let items: any[] = []
      try {
        items = await fetchTrending(octokit, periodDays)
        // ensure we always have 50 results if possible
        if (!items || items.length < 10) {
          const fallbackDays = periodDays < 30 ? 30 : 90
          items = await fetchTrending(octokit, fallbackDays)
        }
      } catch {
        // ignore; handled by final fallback
      }
      if (!items || items.length === 0) {
        const { data } = await octokit.search.repos({
          q: "is:public stars:>20000",
          sort: "stars",
          order: "desc",
          per_page: 50,
        })
        items = data.items
      }
      repositories = items.slice(0, 50).map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || "",
        language: repo.language || "",
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        topics: repo.topics || [],
        html_url: repo.html_url,
        owner: { login: repo.owner.login, avatar_url: repo.owner.avatar_url },
        updated_at: repo.updated_at,
      }))
    } else {
      // Check if we have actual filters (not default values)
      const hasSearchFilter = search && search.trim() !== ""
      const hasLanguageFilter = language && language !== "all"
      const hasMinStarsFilter = minStars && minStars !== "any"

      if (hasSearchFilter || hasLanguageFilter || hasMinStarsFilter) {
        // Build search query
        let query = "is:public"
        if (hasSearchFilter) query += ` ${search} in:name,description`
        if (hasLanguageFilter) query += ` language:${language}`
        if (hasMinStarsFilter) query += ` stars:>=${minStars}`

        const { data } = await octokit.search.repos({
          q: query,
          sort: sortBy === "stars" ? "stars" : sortBy === "forks" ? "forks" : "updated",
          order: "desc",
          per_page: 50,
        })

        repositories = data.items.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description || "",
          language: repo.language || "",
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          topics: repo.topics || [],
          html_url: repo.html_url,
          owner: {
            login: repo.owner.login,
            avatar_url: repo.owner.avatar_url,
          },
          updated_at: repo.updated_at,
        }))
      } else {
        // Dynamic trending fallback (no static list)
        // Try weekly trending first, then 90-day window, then all-time by stars as last resort
        let items: any[] = []
        try {
          items = await fetchTrending(octokit, 14)
          if (!items || items.length < 10) {
            items = await fetchTrending(octokit, 90)
          }
        } catch {
          // ignore and try broader search below
        }
        if (!items || items.length === 0) {
          const { data } = await octokit.search.repos({
            q: "is:public stars:>20000",
            sort: "stars",
            order: "desc",
            per_page: 50,
          })
          items = data.items
        }
        repositories = items.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description || "",
          language: repo.language || "",
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          topics: repo.topics || [],
          html_url: repo.html_url,
          owner: {
            login: repo.owner.login,
            avatar_url: repo.owner.avatar_url,
          },
          updated_at: repo.updated_at,
        }))
      }
    }

    // Sort repositories based on sortBy parameter
    repositories.sort((a, b) => {
      switch (sortBy) {
        case "stars":
          return b.stargazers_count - a.stargazers_count
        case "forks":
          return b.forks_count - a.forks_count
        case "updated":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return b.stargazers_count - a.stargazers_count
      }
    })

    // Cache the results for 1 hour
    try {
      await redis.set(cacheKey, repositories, { ex: 3600 })
    } catch (error) {
      console.warn("Failed to cache results:", error)
    }

    return NextResponse.json({ repositories })
  } catch (error) {
    console.error("Error fetching repositories:", error)
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 })
  }
}
