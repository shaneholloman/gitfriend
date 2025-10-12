import { NextRequest, NextResponse } from "next/server"
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

// Default repositories to show when no filters are applied
const DEFAULT_REPOS = [
  "ollama/ollama",
  "supabase/supabase",
  "FortAwesome/Font-Awesome",
  "FlowiseAI/flowise",
  "payloadcms/payload",
  "mattermost/mattermost",
  "mindsdb/mindsdb",
  "refinedev/refine",
  "khoj-ai/khoj",
  "twentyhq/twenty"
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const language = searchParams.get("language") || ""
    const minStars = searchParams.get("minStars") || ""
    const sortBy = searchParams.get("sortBy") || "stars"

    // Create cache key based on filters
    const cacheKey = `opensource:${search || 'default'}:${language || 'all'}:${minStars || 'any'}:${sortBy}`
    
    // Try to get from cache first
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

    // Check if we have actual filters (not default values)
    const hasSearchFilter = search && search.trim() !== ""
    const hasLanguageFilter = language && language !== "all"
    const hasMinStarsFilter = minStars && minStars !== "any"

    console.log("API Debug:", { search, language, minStars, sortBy, hasSearchFilter, hasLanguageFilter, hasMinStarsFilter })

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
      // Fetch default repositories
      console.log("Fetching default repositories:", DEFAULT_REPOS)
      const repoPromises = DEFAULT_REPOS.map(async (repoFullName) => {
        try {
          const [owner, repo] = repoFullName.split("/")
          const { data } = await octokit.repos.get({ owner, repo })
          return {
            id: data.id,
            name: data.name,
            full_name: data.full_name,
            description: data.description || "",
            language: data.language || "",
            stargazers_count: data.stargazers_count,
            forks_count: data.forks_count,
            topics: data.topics || [],
            html_url: data.html_url,
            owner: {
              login: data.owner.login,
              avatar_url: data.owner.avatar_url,
            },
            updated_at: data.updated_at,
          }
        } catch (error) {
          console.error(`Error fetching ${repoFullName}:`, error)
          return null
        }
      })

      const results = await Promise.all(repoPromises)
      repositories = results.filter((repo): repo is Repository => repo !== null)
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
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    )
  }
}
