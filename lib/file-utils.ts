export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".")
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : ""
}

export function getLanguageFromExtension(extension: string): string {
  const extensionMap: Record<string, string> = {
    js: "JavaScript",
    jsx: "JavaScript (React)",
    ts: "TypeScript",
    tsx: "TypeScript (React)",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    json: "JSON",
    md: "Markdown",
    py: "Python",
    rb: "Ruby",
    go: "Go",
    java: "Java",
    php: "PHP",
    c: "C",
    cpp: "C++",
    cs: "C#",
    swift: "Swift",
    kt: "Kotlin",
    rs: "Rust",
    sh: "Shell",
    yml: "YAML",
    yaml: "YAML",
    toml: "TOML",
    sql: "SQL",
    graphql: "GraphQL",
    vue: "Vue",
    svelte: "Svelte",
  }

  return extensionMap[extension] || ""
}
