import { Octokit } from "@octokit/rest"
import { Groq } from "groq-sdk"
import { type NextRequest, NextResponse } from "next/server"
import { redis, CACHE_KEYS, CACHE_TTL, type ReadmeGenerationStatus } from "@/lib/redis"
import { scanRepository, type ScannedFile, type RepoAnalysis } from "@/lib/github"
import { withTimeout } from "@/lib/timeout-utils"

// Define types and functions inline to avoid import issues
type ProjectKind = "web" | "python" | "java" | "native" | "unknown"

const BINARY_EXT =
  /\.(png|jpg|jpeg|gif|webp|svg|ico|mp4|mov|avi|mkv|mp3|wav|flac|ogg|pdf|zip|tar|gz|bz2|7z|rar|exe|dll|so|dylib|bin|psd|ai|sketch|blend|glb|gltf|ttf|otf|woff2?)$/i
const LOCKFILES = /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|\.lock)$/i
const UNIVERSAL_IGNORES =
  /(^|\/)(node_modules|\.git|\.next|dist|build|out|target|venv|\.venv|__pycache__|\.cache|coverage|\.turbo|\.pnpm|bin|tmp|temp|logs?|datasets?|data|\.dvc|public\/uploads?)(\/|$)/i

function detectProjectKind(analysis: RepoAnalysis): ProjectKind {
  const paths = analysis.files.map((f) => f.path.toLowerCase())
  const has = (re: RegExp) => paths.some((x) => re.test(x))

  if (has(/package\.json$/) || has(/\.(tsx|jsx|html?)$/) || has(/next\.config\.(js|mjs|ts)$/)) return "web"
  if (has(/requirements\.txt$/) || has(/pyproject\.toml$/) || has(/\.py$/)) return "python"
  if (has(/pom\.xml$/) || has(/\.java$/)) return "java"
  if (has(/\.(c|cc|cpp|h|hpp|go|rs)$/) || has(/(Makefile|CMakeLists\.txt|go\.mod|Cargo\.toml)$/)) return "native"
  return "unknown"
}

function shouldIncludeByKind(kind: ProjectKind, path: string): boolean {
  const p = path.toLowerCase()
  if (p.endsWith("readme.md")) return true
  if (p.endsWith("dockerfile") || p.endsWith("docker-compose.yml") || p.endsWith(".env.example")) return true
  if (
    p.endsWith("package.json") ||
    p.endsWith("pom.xml") ||
    p.endsWith("requirements.txt") ||
    p.endsWith("pyproject.toml")
  )
    return true
  if (
    p.endsWith("tsconfig.json") ||
    p.endsWith("next.config.js") ||
    p.endsWith("next.config.mjs") ||
    p.endsWith("next.config.ts")
  )
    return true
  if (p.endsWith("go.mod") || p.endsWith("cargo.toml") || p.endsWith("cmakelists.txt") || p === "makefile") return true

  switch (kind) {
    case "web":
      return /\.(tsx|jsx|ts|js|mjs|cjs|html?|json|ya?ml|css|scss|less|toml|md)$/i.test(p) && !/\.d\.ts$/.test(p)
    case "python":
      return /\.(py|md|txt|ya?ml|toml)$/i.test(p) || p.endsWith("requirements.txt")
    case "java":
      return /\.(java|md|xml|properties|gradle)$/i.test(p) || p.endsWith("pom.xml")
    case "native":
      return (
        /\.(c|cc|cpp|h|hpp|rs|go|md|toml|txt)$/i.test(p) || /(go\.mod|Cargo\.toml|CMakeLists\.txt|Makefile)$/i.test(p)
      )
    default:
      return /\.(md|txt|json|ya?ml|toml|xml|html?|css|scss|less|js|jsx|ts|tsx|mjs|cjs|sh|bash|zsh)$/i.test(p)
  }
}

function selectRelevantFiles(kind: ProjectKind, files: ScannedFile[], maxFiles = 50) {
  const filtered = files.filter((f) => {
    const p = f.path
    if (UNIVERSAL_IGNORES.test(p)) return false
    if (LOCKFILES.test(p)) return false
    if (BINARY_EXT.test(p)) return false
    return shouldIncludeByKind(kind, p)
  })

  const score = (p: string) => {
    const l = p.toLowerCase()
    if (l.endsWith("readme.md")) return 0
    if (/(package\.json|requirements\.txt|pom\.xml)$/i.test(l)) return 1
    if (l.includes("/app/") || l.includes("/src/")) return 2
    if (l.includes("/api/") || l.includes("/lib/")) return 3
    if (l.includes("docker")) return 4
    return 5
  }

  return filtered.sort((a, b) => score(a.path) - score(b.path)).slice(0, maxFiles)
}

function buildContextBlock(analysis: RepoAnalysis, files: ScannedFile[]) {
  const meta = `Repo: ${analysis.owner}/${analysis.repo}
Name: ${analysis.repoMeta.name}
Description: ${analysis.repoMeta.description || "N/A"}
Languages: ${Object.keys(analysis.languages).join(", ") || "Unknown"}
Default Branch: ${analysis.defaultBranch}
Stars: ${analysis.repoMeta.stars}  Forks: ${analysis.repoMeta.forks}  Issues: ${analysis.repoMeta.openIssues}`

  // Limit file content to prevent context from being too large
  const parts = files.slice(0, 40).map((f) => {
    const header = `\n---\nFile: ${f.path}\n`
    const content = f.content ? f.content.slice(0, 1200) : "" // Further limit per-file content
    return header + content
  })
  return `${meta}\n\nKey Files:\n${parts.join("")}`
}

async function summarizeIfNeeded(groq: any, context: string, threshold = 15000): Promise<string> {
  if (context.length <= threshold) return context

  // For rate limiting, just truncate instead of making multiple API calls
  console.warn("[README] Context too long, truncating to avoid rate limits")
  return context.slice(0, threshold) + "\n\n... (truncated to avoid rate limits)"
}

function deriveTechStackHint(files: ScannedFile[]): string {
  const text = files
    .filter((f) => f.content && /\.(md|json|js|ts|tsx|jsx|py|java|toml|go|rs)$/i.test(f.path))
    .map((f) => `\n[${f.path}]\n${f.content}`)
    .join("")
    .toLowerCase()

  const hits: string[] = []
  const mark = (k: string, needle: RegExp) => {
    if (needle.test(text)) hits.push(k)
  }

  mark("Next.js", /next(\.js)?/i)
  mark("React", /react/i)
  mark("TypeScript", /typescript|\.ts(x)?\b/i)
  mark("Tailwind CSS", /tailwind/i)
  mark("Prisma", /prisma/i)
  mark("NextAuth", /next-?auth/i)
  mark("Vercel", /vercel/i)
  mark("Python", /\bpython\b|\.py\b/i)
  mark("Java", /\bjava\b|pom\.xml/i)
  mark("Go", /\bgo\b|go\.mod/i)
  mark("Rust", /\brust\b|cargo\.toml/i)
  mark("Docker", /dockerfile|docker-compose/i)
  mark("Redis", /redis/i)
  mark("Supabase", /supabase/i)

  const uniq = Array.from(new Set(hits))
  return uniq.length ? uniq.join(", ") : "See Languages and dependencies"
}

function buildReadmeSystemPrompt(compressedContext: string, techStackHint: string, customInstructions?: string) {
  return `
You are GitFriend's README author powered by Groq. Produce a minimal, professional, and publication-ready README.md with clear Markdown hierarchy and spacing.

Output structure (strict):
- Start with:
  # <Project Name>
  <One-line tagline>
  _Building 21st century open-source infrastructure_
  [Learn more »](#introduction)
- Below that, a "Quick Links" line using internal anchors (Introduction · Tech Stack · Contributing · Discord)

Then follow with sections in this exact order:
## Introduction
## Tech Stack
## How It's Built
## Requirements / Prerequisites
## Installation
## Configuration
## Usage
## Project Structure
## Features
## Deployment (if applicable)
## Contributing
## License
## FAQ (optional)

Formatting rules:
- Use simple Markdown. No HTML, no custom CSS.
- Center title and tagline visually through spacing (not HTML).
- Prefer concise descriptions and consistent spacing between sections.
- Use bullet lists for items, fenced code blocks for commands.
- Never include triple-backticks around the entire README output.
- No images, badges, or external decorative assets.

Authoring rules:
- Do not fabricate details; derive only from context.
- Merge any existing README data but avoid repetition.
- Keep tone neutral, technical, and developer-facing.
- Focus on clarity and minimalism.

Context (compressed):
${compressedContext}

Tech Stack Hint (best-effort): ${techStackHint}

${customInstructions ? `User Notes: ${customInstructions}` : ""}
`
}


// Initialize Groq (singleton ok in route scope)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

// Keep a single Octokit instance for lightweight calls still used here
const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
})

async function fetchLanguages(owner: string, repo: string) {
  const { data } = await octokit.repos.listLanguages({ owner, repo })
  return data
}

async function fetchFileContents(owner: string, repo: string, path: string) {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path })
    return "content" in data ? Buffer.from(data.content, "base64").toString() : null
  } catch (e) {
    console.error(`Error fetching file content at path: ${path}`, e)
    return null
  }
}

// Type for repo tree entries
interface RepoTreeEntry {
  name: string
  path: string
  type: "file" | "dir"
  content?: string | null
}

// Recursively fetch files and their contents (with limits)
async function fetchRepoTreeAndContents(
  owner: string,
  repo: string,
  path = "",
  depth = 0,
  maxDepth = 2,
  maxFiles = 30,
  collected: RepoTreeEntry[] = [],
): Promise<RepoTreeEntry[]> {
  if (depth > maxDepth || collected.length >= maxFiles) return collected
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path })
    if (Array.isArray(data)) {
      for (const item of data) {
        if (collected.length >= maxFiles) break
        if (item.type === "file") {
          // Only fetch content for key files or small files
          let content: string | null = null
          if (
            /^(readme|package|tsconfig|next\.config|dockerfile|\.env|main|index|app|src|setup|config|requirements|pyproject|composer|build|Makefile|Procfile|server|client|api|lib|utils|test|spec|docs?)\./i.test(
              item.name,
            ) ||
            item.size < 20000
          ) {
            try {
              const fileContent = await fetchFileContents(owner, repo, item.path)
              // Only take first 1000 chars for large files
              content = fileContent
                ? fileContent.slice(0, 1000) + (fileContent.length > 1000 ? "\n... (truncated)" : "")
                : null
            } catch {}
          }
          collected.push({ name: item.name, path: item.path, type: "file", content })
        } else if (item.type === "dir") {
          collected.push({ name: item.name, path: item.path, type: "dir" })
          await fetchRepoTreeAndContents(owner, repo, item.path, depth + 1, maxDepth, maxFiles, collected)
        }
      }
    }
  } catch (e) {
    // Ignore errors for folders/files we can't access
  }
  return collected
}

async function releaseReadmeLock(repoUrl: string) {
  try {
    await redis.del(CACHE_KEYS.README_LOCK(repoUrl))
  } catch (error) {
    console.error(`[README] Failed to release lock for ${repoUrl}`, error)
  }
}

// Check if README generation is already in progress or completed
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const repoUrl = url.searchParams.get("repoUrl")

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    // Check if we have a cached README
    const cachedReadme = await redis.get(CACHE_KEYS.README_GENERATION(repoUrl))
    if (cachedReadme) {
      return NextResponse.json({
        status: "completed",
        readme: cachedReadme,
      })
    }

    // Check the status of generation
    const status = await redis.get<ReadmeGenerationStatus>(CACHE_KEYS.README_STATUS(repoUrl))
    const error = await redis.get<string>(CACHE_KEYS.README_ERROR(repoUrl))

    const rateLimitKey = CACHE_KEYS.README_RATE_LIMIT(repoUrl)
    const now = Date.now()
    const lastRequest = await redis.get<string>(rateLimitKey)

    if (lastRequest && now - Number(lastRequest) < CACHE_TTL.STATUS_POLL_COOLDOWN * 1000) {
      console.info(`[README] Rate limit hit for status check on ${repoUrl}`)
      return NextResponse.json({
        status: status || "not_started",
        rateLimited: true,
        error: error || undefined,
      })
    }

    await redis.set(rateLimitKey, String(now), { ex: CACHE_TTL.STATUS_POLL_COOLDOWN })

    return NextResponse.json({
      status: status || "not_started",
      error: error || undefined,
    })
  } catch (error: any) {
    console.error("Error checking README status:", error)
    return NextResponse.json({ error: "Failed to check README status", details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Accept 'force' to bypass cache and always regenerate
    const { repoUrl, customInstructions, force, stream: useStream } = await req.json()

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    const match = repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git)?$/)
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
    }

    // Check if we already have a cached README, unless force is true
    if (!force) {
      const cachedReadme = await redis.get(CACHE_KEYS.README_GENERATION(repoUrl))
      if (cachedReadme) {
        return NextResponse.json({
          status: "completed",
          readme: cachedReadme,
          cached: true,
        })
      }
    }

    // Check if generation is already in progress
    const status = await redis.get<ReadmeGenerationStatus>(CACHE_KEYS.README_STATUS(repoUrl))
    if (status === "processing" || status === "pending") {
      console.info(`[README] Skipping generation for ${repoUrl}; current status: ${status}`)
      return NextResponse.json({
        status: status,
        message: "README generation is already in progress",
      })
    }

    const lockKey = CACHE_KEYS.README_LOCK(repoUrl)
    const lockAcquired = await redis.set(lockKey, Date.now().toString(), { ex: CACHE_TTL.LOCK, nx: true })

    if (!lockAcquired) {
      console.info(`[README] Skipping generation for ${repoUrl} due to active lock`)
      return NextResponse.json({
        status: status || "pending",
        message: "README generation is already in progress",
      })
    }

    // Set status to pending and clear any previous error
    await redis.set(CACHE_KEYS.README_STATUS(repoUrl), "processing", { ex: CACHE_TTL.STATUS })
    await redis.del(CACHE_KEYS.README_ERROR(repoUrl))

    // If streaming is requested, return a streaming response
    if (useStream) {
      return new Response(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()
            try {
              const [, owner, repo] = match
              
              // Scan repository
              const analysis = await scanRepository({
                owner,
                repo,
                maxFiles: 50,
                maxFileSizeBytes: 100_000,
                perFileCharLimit: 1500,
              })

              const kind = detectProjectKind(analysis)
              const relevant = selectRelevantFiles(kind, analysis.files, 50)
              const contextRaw = buildContextBlock(analysis, relevant)
              const compressedContext = await summarizeIfNeeded(groq, contextRaw, 6000)
              const techStackHint = deriveTechStackHint(relevant)
              const systemPrompt = buildReadmeSystemPrompt(compressedContext, techStackHint, customInstructions)

              // Stream the Groq response
              const completion = await groq.chat.completions.create({
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: "Generate the README.md now. Begin with name, description, and tech stack." },
                ],
                model: "openai/gpt-oss-120b",
                temperature: 0.7,
                max_completion_tokens: 2000,
                top_p: 1,
                stream: true,
              })

              let fullReadme = ""
              for await (const chunk of completion) {
                const content = chunk.choices?.[0]?.delta?.content || ""
                if (content) {
                  fullReadme += content
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                }
              }

              // Save to cache
              await redis.set(CACHE_KEYS.README_GENERATION(repoUrl), fullReadme, { ex: CACHE_TTL.README })
              await redis.set(CACHE_KEYS.README_STATUS(repoUrl), "completed", { ex: CACHE_TTL.STATUS })
              
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
              controller.close()
            } catch (error: any) {
              const errorMessage = error instanceof Error ? error.message : "Failed to generate README"
              await redis.set(CACHE_KEYS.README_STATUS(repoUrl), "failed", { ex: CACHE_TTL.STATUS })
              await redis.set(CACHE_KEYS.README_ERROR(repoUrl), errorMessage, { ex: CACHE_TTL.STATUS })
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
              controller.close()
            } finally {
              await releaseReadmeLock(repoUrl)
            }
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        }
      )
    }

    // Start the generation process in the background (non-streaming)
    console.info(`[README] Starting background generation for ${repoUrl}`)
    generateReadmeInBackground(repoUrl, customInstructions).catch((error) => {
      console.error(`[README] Background generation failed for ${repoUrl}`, error)
    })

    return NextResponse.json({
      status: "pending",
      message: "README generation has started",
    })
  } catch (error: any) {
    console.error("Error starting README generation:", error)
    return NextResponse.json({ error: "Failed to start README generation", details: error.message }, { status: 500 })
  }
}

// Background process to generate README
async function generateReadmeInBackground(repoUrl: string, customInstructions?: string) {
  const startTime = Date.now()
  try {
    await redis.set(CACHE_KEYS.README_STATUS(repoUrl), "processing", { ex: CACHE_TTL.STATUS })
    console.info(`[README] Starting generation for ${repoUrl}`)

    const match = repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git)?(?:\/)?$/)
    if (!match) {
      throw new Error("Invalid GitHub URL")
    }
    const [, owner, repo] = match

    // Full repo analysis (optimized for speed)
    console.info(`[README] Scanning repository ${owner}/${repo}...`)
    const analysis = await scanRepository({
      owner,
      repo,
      maxFiles: 50, // Further reduced for faster processing
      maxFileSizeBytes: 100_000, // Reduced
      perFileCharLimit: 1500, // Reduced for faster processing
    })
    console.info(`[README] Repository scan completed in ${Date.now() - startTime}ms`)

    const kind = detectProjectKind(analysis)
    const relevant = selectRelevantFiles(kind, analysis.files, 50) // Reduced from 100
    const contextRaw = buildContextBlock(analysis, relevant)
    const compressedContext = await summarizeIfNeeded(groq, contextRaw, 6000) // Reduced threshold for faster processing
    const techStackHint = deriveTechStackHint(relevant)
    console.info(`[README] Context prepared (${compressedContext.length} chars), calling Groq API...`)

    const systemPrompt = buildReadmeSystemPrompt(compressedContext, techStackHint, customInstructions)

    // Add retry logic with timeout for rate limiting
    let completion
    let retries = 3
    const groqStartTime = Date.now()
    while (retries > 0) {
      try {
        // Wrap Groq API call with 60 second timeout to prevent hanging
        completion = await withTimeout(
          groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "Generate the README.md now. Begin with name, description, and tech stack." },
            ],
            model: "openai/gpt-oss-120b",
            temperature: 0.7,
            max_completion_tokens: 2000, // Reduced for faster generation
            top_p: 1,
            stream: false, // Non-streaming for background
          }),
          60000, // 60 second timeout
          "Groq API call timed out after 60 seconds"
        )
        console.info(`[README] Groq API call completed in ${Date.now() - groqStartTime}ms`)
        break // Success, exit retry loop
      } catch (error: any) {
        if (error?.status === 429 && retries > 1) {
          // Rate limited, wait and retry
          const waitTime = Math.pow(2, 3 - retries) * 1000 // Exponential backoff
          console.warn(`[README] Rate limited, waiting ${waitTime}ms before retry ${4 - retries}/3`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          retries--
        } else if (error?.message?.includes("timed out") && retries > 1) {
          // Timeout error, retry once
          console.warn(`[README] API call timed out after ${Date.now() - groqStartTime}ms, retrying... (${4 - retries}/3)`)
          retries--
        } else {
          throw error // Re-throw if not rate limit/timeout or no retries left
        }
      }
    }

    if (!completion) {
      throw new Error("Failed to generate README after retries")
    }

    const generatedReadme = completion.choices?.[0]?.message?.content
    if (!generatedReadme) {
      throw new Error("Groq did not return content")
    }

    await redis.set(CACHE_KEYS.README_GENERATION(repoUrl), generatedReadme, { ex: CACHE_TTL.README })
    await redis.set(CACHE_KEYS.README_STATUS(repoUrl), "completed", { ex: CACHE_TTL.STATUS })
    const totalTime = Date.now() - startTime
    console.info(`[README] Completed background generation for ${repoUrl} in ${totalTime}ms`)
    return generatedReadme
  } catch (error) {
    console.error("[v0] Error generating README:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate README"
    await redis.set(CACHE_KEYS.README_STATUS(repoUrl), "failed", { ex: CACHE_TTL.STATUS })
    await redis.set(CACHE_KEYS.README_ERROR(repoUrl), errorMessage, { ex: CACHE_TTL.STATUS })
    throw error
  } finally {
    await releaseReadmeLock(repoUrl)
  }
}
