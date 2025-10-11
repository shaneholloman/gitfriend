import type { ScannedFile, RepoAnalysis } from "@/lib/github"
import type Groq from "groq-sdk"

export type ProjectKind = "web" | "python" | "java" | "native" | "unknown"

const BINARY_EXT =
  /\.(png|jpg|jpeg|gif|webp|svg|ico|mp4|mov|avi|mkv|mp3|wav|flac|ogg|pdf|zip|tar|gz|bz2|7z|rar|exe|dll|so|dylib|bin|psd|ai|sketch|blend|glb|gltf|ttf|otf|woff2?)$/i
const LOCKFILES = /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|\.lock)$/i
const UNIVERSAL_IGNORES =
  /(^|\/)(node_modules|\.git|\.next|dist|build|out|target|venv|\.venv|__pycache__|\.cache|coverage|\.turbo|\.pnpm|bin|tmp|temp|logs?|datasets?|data|\.dvc|public\/uploads?)(\/|$)/i

export function detectProjectKind(analysis: RepoAnalysis): ProjectKind {
  const paths = analysis.files.map((f) => f.path.toLowerCase())
  const has = (re: RegExp) => paths.some((x) => re.test(x))

  if (has(/package\.json$/) || has(/\.(tsx|jsx|html?)$/) || has(/next\.config\.(js|mjs|ts)$/)) return "web"
  if (has(/requirements\.txt$/) || has(/pyproject\.toml$/) || has(/\.py$/)) return "python"
  if (has(/pom\.xml$/) || has(/\.java$/)) return "java"
  if (has(/\.(c|cc|cpp|h|hpp|go|rs)$/) || has(/(Makefile|CMakeLists\.txt|go\.mod|Cargo\.toml)$/)) return "native"
  return "unknown"
}

export function shouldIncludeByKind(kind: ProjectKind, path: string): boolean {
  const p = path.toLowerCase()
  // Always-include important docs/configs
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
      // Web: include .tsx, .jsx, .html, .json (ignore builds)
      return /\.(tsx|jsx|ts|js|mjs|cjs|html?|json|ya?ml|css|scss|less|toml|md)$/i.test(p) && !/\.d\.ts$/.test(p)
    case "python":
      // Python: include .py, requirements.txt, ignore venv, data
      return /\.(py|md|txt|ya?ml|toml)$/i.test(p) || p.endsWith("requirements.txt")
    case "java":
      // Java: include .java, pom.xml, ignore target
      return /\.(java|md|xml|properties|gradle)$/i.test(p) || p.endsWith("pom.xml")
    case "native":
      // C/C++/Go/Rust: include sources and build configs, ignore binaries
      return (
        /\.(c|cc|cpp|h|hpp|rs|go|md|toml|txt)$/i.test(p) || /(go\.mod|Cargo\.toml|CMakeLists\.txt|Makefile)$/i.test(p)
      )
    default:
      // Fallback text-like files
      return /\.(md|txt|json|ya?ml|toml|xml|html?|css|scss|less|js|jsx|ts|tsx|mjs|cjs|sh|bash|zsh)$/i.test(p)
  }
}

export function selectRelevantFiles(kind: ProjectKind, files: ScannedFile[], maxFiles = 220) {
  const filtered = files.filter((f) => {
    const p = f.path
    if (UNIVERSAL_IGNORES.test(p)) return false
    if (LOCKFILES.test(p)) return false
    if (BINARY_EXT.test(p)) return false
    return shouldIncludeByKind(kind, p)
  })

  // Priority scoring
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

export function buildContextBlock(analysis: RepoAnalysis, files: ScannedFile[]) {
  const meta = `Repo: ${analysis.owner}/${analysis.repo}
Name: ${analysis.repoMeta.name}
Description: ${analysis.repoMeta.description || "N/A"}
Languages: ${Object.keys(analysis.languages).join(", ") || "Unknown"}
Default Branch: ${analysis.defaultBranch}
Stars: ${analysis.repoMeta.stars}  Forks: ${analysis.repoMeta.forks}  Issues: ${analysis.repoMeta.openIssues}`

  const parts = files.map((f) => {
    const header = `\n---\nFile: ${f.path}\n`
    return header + (f.content ? f.content : "")
  })
  return `${meta}\n\nKey Files:\n${parts.join("")}`
}

export async function summarizeIfNeeded(groq: Groq, context: string, threshold = 15000): Promise<string> {
  if (context.length <= threshold) return context

  const chunkSize = 6000
  const chunks: string[] = []
  for (let i = 0; i < context.length; i += chunkSize) {
    chunks.push(context.slice(i, i + chunkSize))
  }

  const partial: string[] = []
  for (const [i, chunk] of chunks.entries()) {
    const summary = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You compress repository context. Preserve: project name, concise description/purpose, primary tech stack/frameworks/tools, high-level architecture and main logic flow. Omit boilerplate. Return a compact plain-text summary.",
        },
        { role: "user", content: `Chunk ${i + 1}/${chunks.length}:\n${chunk}` },
      ],
      temperature: 0.2,
      top_p: 1,
      max_completion_tokens: 800,
      stream: false,
    })
    partial.push(summary.choices?.[0]?.message?.content || "")
  }

  const merged = partial.join("\n")
  const final = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content:
          "You merge chunk summaries into a single compact context. Keep: project name, description, tech stack, requirements, core modules and main logic flow. Output plain text under 12k characters.",
      },
      { role: "user", content: merged },
    ],
    temperature: 0.2,
    top_p: 1,
    max_completion_tokens: 1200,
    stream: false,
  })
  return final.choices?.[0]?.message?.content || merged
}

export function deriveTechStackHint(files: ScannedFile[]): string {
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

export function buildReadmeSystemPrompt(compressedContext: string, techStackHint: string, customInstructions?: string) {
  // We reference the user's screenshot via Source URL as guidance.
  const referenceImage =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-qGkDkby5jwbfb9ePVutsxIxV2FemcR.png"

  return `
You are GitFriend's README author powered by Groq. Produce a polished, publication-ready README.md with excellent Markdown rendering and clear hierarchy.

Output requirements (strict):
- Start with: 
  # <Project Name>
  <One-sentence tagline/description>
  Tech Stack
- Follow with these sections in order, using Markdown headings (##) and consistent spacing:
  Introduction
  Tech Stack (bulleted list with links where obvious)
  How It's Built (Architecture / Key Modules)
  Requirements / Prerequisites
  Installation
  Configuration (environment variables, including .env.example if present)
  Usage (commands, examples)
  Project Structure (short tree or bullets of core files)
  Features
  Deployment (if applicable)
  Contributing
  License
  FAQ (optional, short)

Formatting & style (inspired by the reference image at ${referenceImage}):
- Prominent H1 title and a concise tagline.
- Add an inline "Quick Links" line below the tagline using internal anchors: Introduction · Tech Stack · Usage · Contributing (only include links to sections that exist).
- Use clean Markdown, no HTML unless absolutely necessary.
- Prefer short paragraphs, bullet lists, and fenced code blocks for commands.
- Never include triple-backticks around the entire README; output just the markdown body.

Authoring rules:
- Never fabricate specifics. Use best-effort synthesis from the provided context.
- If information is missing, state reasonable placeholders (e.g., "TBD") sparingly.
- Merge and improve any existing README content without duplication.
- Keep language straightforward and developer-friendly.

Context (compressed):
${compressedContext}

Tech Stack Hint (best-effort): ${techStackHint}

${customInstructions ? `User Notes: ${customInstructions}` : ""}`
}
