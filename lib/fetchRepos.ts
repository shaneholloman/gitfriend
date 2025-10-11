export const DEFAULT_PER_PAGE = 20

export type OssSearchParams = {
  q?: string
  language?: string // "all" or language name
  difficulty?: "all" | "beginner" | "intermediate" | "advanced"
  sort?: "popular" | "new" | "old" | "growing"
  order?: "asc" | "desc"
  page?: number
  perPage?: number
}

export type OssRepo = {
  id: number
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  topics?: string[]
  owner: { avatar_url?: string }
}

export type DecoratedRepo = OssRepo & {
  tags: string[]
  popularity: "Legendary" | "Famous" | "Rising"
}

export function buildSearchParams(p: OssSearchParams) {
  const params = new URLSearchParams()
  const q: string[] = []

  if (p.q) q.push(p.q)
  if (p.language && p.language !== "all") q.push(`language:${p.language}`)
  // Difficulty is a heuristic based on topics; search includes topic if selected
  if (p.difficulty && p.difficulty !== "all") q.push(`topic:${p.difficulty}`)

  // default: filter to public repos, non-archived
  q.push("is:public")
  q.push("archived:false")

  params.set("q", q.join(" "))

  // sort mapping
  switch (p.sort) {
    case "popular":
      params.set("sort", "stars")
      break
    case "new":
      params.set("sort", "created")
      params.set("order", "desc")
      break
    case "old":
      params.set("sort", "created")
      params.set("order", "asc")
      break
    case "growing":
      params.set("sort", "updated")
      params.set("order", "desc")
      break
    default:
      params.set("sort", "stars")
  }
  if (p.order) params.set("order", p.order)
  params.set("per_page", String(p.perPage ?? DEFAULT_PER_PAGE))
  params.set("page", String(p.page ?? 1))

  // GitHub includes topics in results if Accept header is correct;
  // Our fetcher sets the proper header.
  return params.toString()
}

export async function fetchRepos(paramString: string): Promise<{ items: OssRepo[]; end: boolean }> {
  // For now, use direct GitHub API with proper error handling
  // TODO: Implement proper server-side caching
  return fetchReposDirect(paramString)
}

// Fallback function for direct GitHub API calls
async function fetchReposDirect(paramString: string): Promise<{ items: OssRepo[]; end: boolean }> {
  const url = `https://api.github.com/search/repositories?${paramString}`
  
  // For client-side calls, we need to use a different approach
  // This will be handled by server actions instead
  throw new Error("Direct GitHub API calls are not supported on client-side. Use server actions instead.")
}

export function decorateRepo(repo: OssRepo): DecoratedRepo {
  const tags = inferTags(repo)
  const popularity = inferPopularity(repo.stargazers_count)
  return { ...repo, tags, popularity }
}

function inferPopularity(stars: number): DecoratedRepo["popularity"] {
  if (stars >= 80000) return "Legendary"
  if (stars >= 15000) return "Famous"
  return "Rising"
}

function inferTags(repo: OssRepo): string[] {
  const base: string[] = []
  if (repo.language) base.push(repo.language)
  if (repo.topics && repo.topics.length) base.push(...repo.topics.slice(0, 6))
  // lightweight difficulty heuristic
  const desc = `${repo.description ?? ""}`.toLowerCase()
  if (/(beginner|good first issue)/.test(desc)) base.push("beginner")
  if (/(intermediate|mentored|help wanted)/.test(desc)) base.push("intermediate")
  if (/(advanced|expert)/.test(desc)) base.push("advanced")
  return Array.from(new Set(base)).slice(0, 8)
}
