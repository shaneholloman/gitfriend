import { Octokit } from "@octokit/rest"

export type ScannedFile = {
  path: string
  size: number
  type: "file" | "tree" | "blob" | "dir"
  content?: string
}

export type RepoAnalysis = {
  owner: string
  repo: string
  defaultBranch: string
  repoMeta: {
    name: string
    description: string | null
    stars: number
    forks: number
    openIssues: number
  }
  languages: Record<string, number>
  files: ScannedFile[]
}

/**
 * Create an authenticated Octokit with env var
 */
export function createOctokit() {
  const token = process.env.GITHUB_ACCESS_TOKEN
  if (!token) {
    throw new Error("Missing GITHUB_ACCESS_TOKEN")
  }
  return new Octokit({ auth: token })
}

/**
 * Scan a repository comprehensively:
 * - Resolve default branch -> commit -> tree (recursive)
 * - Fetch file content for relevant, text-like files (size + extension filters)
 * - Truncate content to a per-file cap to keep prompts bounded
 * - Limit total files to avoid timeouts
 */
export async function scanRepository(params: {
  owner: string
  repo: string
  maxFiles?: number
  maxFileSizeBytes?: number
  perFileCharLimit?: number
  includeBinary?: boolean
}): Promise<RepoAnalysis> {
  const {
    owner,
    repo,
    maxFiles = 200, // cap total files to scan content for
    maxFileSizeBytes = 256_000, // skip very large files
    perFileCharLimit = 4000, // truncate per-file content
    includeBinary = false,
  } = params

  const octokit = createOctokit()

  // Repo metadata
  const { data: repoData } = await octokit.repos.get({ owner, repo })
  const defaultBranch = repoData.default_branch || "main"

  // Languages
  const { data: languages } = await octokit.repos.listLanguages({ owner, repo })

  // Resolve HEAD of default branch
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch}`,
  })

  // Get commit and tree
  const { data: commit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: ref.object.sha,
  })

  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: commit.tree.sha,
    // @ts-expect-error octokit types accept boolean or 'true'
    recursive: true,
  })

  const allFiles = (tree.tree || [])
    .filter((node: any) => node.type === "blob")
    .map((node: any) => ({
      path: node.path as string,
      sha: node.sha as string,
      size: node.size as number,
      type: "file" as const,
    }))

  // Heuristic filters for meaningful, text-like files
  const textExtensions =
    /\.(md|markdown|txt|json|ya?ml|toml|xml|html?|css|scss|sass|less|js|jsx|ts|tsx|mjs|cjs|py|go|rb|php|java|cs|kt|rs|sol|sql|sh|bash|zsh|fish|env|Dockerfile|Makefile)$/i

  const filtered = allFiles.filter((f) => {
    if (f.size > maxFileSizeBytes) return false
    if (!includeBinary && !textExtensions.test(f.path)) return false
    // Exclude common vendor/lock/build artifacts
    if (f.path.match(/(^|\/)(dist|build|.next|out|node_modules|vendor|\.git|\.pnpm|\.cache|coverage|\.turbo)(\/|$)/))
      return false
    if (f.path.match(/(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|\.lock)$/)) return false
    return true
  })

  // Prioritize key files first
  const priority = (p: string) => {
    const l = p.toLowerCase()
    if (l.endsWith("readme.md")) return 0
    if (l.endsWith("package.json")) return 1
    if (l.endsWith("tsconfig.json") || l.endsWith("next.config.js") || l.endsWith("next.config.mjs")) return 2
    if (l.includes("/app/") || l.includes("/src/")) return 3
    if (l.includes("dockerfile") || l.includes("docker-compose")) return 4
    if (l.endsWith(".md")) return 5
    return 6
  }

  const sorted = filtered.sort((a, b) => priority(a.path) - priority(b.path)).slice(0, maxFiles)

  // Concurrency-limited content fetching
  const concurrency = 6
  let idx = 0
  const results: ScannedFile[] = []

  async function worker() {
    while (idx < sorted.length) {
      const cur = sorted[idx++]
      try {
        const { data } = await octokit.repos.getContent({ owner, repo, path: cur.path })
        if (Array.isArray(data)) {
          // Shouldn't happen (we filtered blobs), but guard it
          results.push({ path: cur.path, size: cur.size, type: "dir" })
          continue
        }
        if ("content" in data && data.content) {
          const decoded = Buffer.from(data.content, "base64").toString()
          const truncated =
            decoded.length > perFileCharLimit ? decoded.slice(0, perFileCharLimit) + "\n... (truncated)" : decoded
          results.push({ path: cur.path, size: cur.size, type: "file", content: truncated })
        } else {
          results.push({ path: cur.path, size: cur.size, type: "file" })
        }
      } catch (err) {
        // Non-fatal: skip paths we cannot read
        results.push({ path: cur.path, size: cur.size, type: "file" })
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, sorted.length) }, () => worker())
  await Promise.all(workers)

  return {
    owner,
    repo,
    defaultBranch,
    repoMeta: {
      name: repoData.name,
      description: repoData.description,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
    },
    languages,
    files: results,
  }
}

/**
 * Format analysis into a compact prompt context for LLMs
 */
export function buildRepoContext(analysis: RepoAnalysis) {
  const header = `Repository: ${analysis.owner}/${analysis.repo}
Default Branch: ${analysis.defaultBranch}
Stars: ${analysis.repoMeta.stars} | Forks: ${analysis.repoMeta.forks} | Issues: ${analysis.repoMeta.openIssues}
Languages: ${Object.keys(analysis.languages).join(", ") || "Unknown"}
Description: ${analysis.repoMeta.description || "No description provided"}`

  const fileSummaries = analysis.files
    .map((f) => {
      if (f.content) {
        return `---\nFile: ${f.path}\n${f.content}`
      }
      return `---\nFile: ${f.path}`
    })
    .join("\n")

  return `${header}\n\nKey Files (truncated content):\n${fileSummaries}`
}
