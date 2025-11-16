"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { UserAuthButton } from "@/components/auth/user-auth-button"
import MarkdownPreview from "@/components/readme/markdown-preview"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  GitBranch,
  Copy,
  Check,
  FileText,
  BookOpen,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Github,
  Code,
  AlertCircle,
  Download,
} from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"

export default function GenerateReadme() {
  // Example repositories
  const exampleRepos = [
    { name: "React", owner: "facebook/react", icon: <Code className="h-5 w-5" /> },
    { name: "GitFriend", owner: "krishn404/Git-Friend", icon: <Zap className="h-5 w-5" /> },
    { name: "TailwindCSS", owner: "tailwindlabs/tailwindcss", icon: <Sparkles className="h-5 w-5" /> },
  ]

  const [repoUrl, setRepoUrl] = useState("")
  const [generatedReadme, setGeneratedReadme] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [repoData, setRepoData] = useState<{
    name: string
    description: string
    language: string
    stars: number
    forks: number
    owner: string
    created_at?: string
    updated_at?: string
  } | null>(null)
  const { theme, setTheme } = useTheme()
  const [customRequirements, setCustomRequirements] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [hoverState, setHoverState] = useState({
    card: false,
    button: false,
    examples: Array(exampleRepos.length).fill(false),
  })
  const { isGuest, guestTimeLeft, guestLogout } = useAuth()
  const [showGuestExpired, setShowGuestExpired] = useState(false)

  // Show modal and block actions when guest session expires
  useEffect(() => {
    if (isGuest && guestTimeLeft === 0) {
      setShowGuestExpired(true)
      guestLogout()
    }
  }, [isGuest, guestTimeLeft, guestLogout])



  const validateRepoUrl = (url: string) => {
    // Simple validation for GitHub repository URL
    const githubRegex = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/?$/i
    return githubRegex.test(url)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && validateRepoUrl(repoUrl)) {
      fetchRepoData()
    }
  }

  // Block API calls and UI actions if guest session expired
  const isGuestBlocked = isGuest && guestTimeLeft === 0

  const fetchRepoData = async (force = false) => {
    if (isGuestBlocked) return
    if (!validateRepoUrl(repoUrl)) {
      setError("Please enter a valid GitHub repository URL")
      return
    }

    setError(null)
    setIsGenerating(true)
    setGeneratedReadme("")
    setRepoData(null)

    try {
      // Extract owner and repo name from URL
      const urlParts = repoUrl.split("/")
      const owner = urlParts[urlParts.length - 2]
      const repo = urlParts[urlParts.length - 1].replace(".git", "")

      // Set initial repo data
      setRepoData({
        name: repo,
        description: "Analyzing repository...",
        language: "Loading...",
        stars: 0,
        forks: 0,
        owner: owner,
      })

      // Start streaming README generation
      const response = await fetch("/api/generate-readme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl,
          customInstructions: customRequirements || undefined,
          force,
          stream: true, // Request streaming
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to start README generation" }))
        throw new Error(errorData.error || "Failed to start README generation")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("Failed to get response stream")
      }

      let buffer = ""
      let readmeContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              setIsGenerating(false)
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.content) {
                readmeContent += parsed.content
                setGeneratedReadme(readmeContent)
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      setIsGenerating(false)
    } catch (error) {
      console.error("Error generating README:", error)
      setError(error instanceof Error ? error.message : "Failed to generate README")
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReadme)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadReadme = () => {
    const element = document.createElement("a")
    const file = new Blob([generatedReadme], { type: "text/markdown" })
    element.href = URL.createObjectURL(file)
    element.download = "README.md"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleExampleClick = (repo: string) => {
    setRepoUrl(`https://github.com/${repo}`)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Show guest timer at the top if guest
  const guestTimerBar =
    isGuest && guestTimeLeft && guestTimeLeft > 0 ? (
      <div className="w-full bg-yellow-100 text-yellow-800 text-center py-2 font-medium text-sm sticky top-0 z-50">
        Guest access: {Math.floor(guestTimeLeft / 60)}:{(guestTimeLeft % 60).toString().padStart(2, "0")} left.{" "}
        <span className="font-normal">Sign in for unlimited access.</span>
      </div>
    ) : null

  return (
    <ProtectedRoute>
      {guestTimerBar}
      <div className="flex min-h-screen flex-col bg-[hsl(var(--readme-bg))] text-[hsl(var(--readme-text))]">
        <header className="sticky top-0 z-40 border-b border-[hsl(var(--readme-border))] bg-[hsl(var(--readme-bg))/80] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--readme-bg))/60]">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <GitBranch className="h-6 w-6" />
                <span className="text-xl font-bold">Git Friend</span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-[hsl(var(--readme-primary))] transition-colors">
                Home
              </Link>
              <Link
                href="/ai-chat"
                className="text-sm font-medium hover:text-[hsl(var(--readme-primary))] transition-colors"
              >
                AI Chat
              </Link>
              <Link
                href="/generate-readme"
                className="text-sm font-medium text-[hsl(var(--readme-primary))] transition-colors"
              >
                Generate Readme
              </Link>
              <Link
                href="/git-mojis"
                className="text-sm font-medium hover:text-[hsl(var(--readme-primary))] transition-colors"
              >
                Git Mojis
              </Link>
              {/* <Link
                href="/repo-visualizer"
                className="text-sm font-medium hover:text-[hsl(var(--readme-primary))] transition-colors"
              >
                Repo Visualizer
              </Link> */}
            </nav>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <UserAuthButton />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 relative">
          <div className="container max-w-6xl mx-auto py-12">
            <div className="flex justify-center mb-2">
              <div className="bg-[hsl(var(--readme-primary))/20] text-[hsl(var(--readme-primary))] px-4 py-1.5 rounded-full text-sm font-medium">
                DOCUMENTATION ASSISTANT
              </div>
            </div>

            <motion.div
              className="mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-bold mb-4">
                <span>Readme</span> <span className="text-[hsl(var(--readme-primary))]">Assistant</span>{" "}
                <span>for Your</span> <span className="text-[hsl(var(--readme-primary))]">Project</span>
              </h1>
              <p className="text-[hsl(var(--readme-text-muted))] max-w-2xl mx-auto text-lg">
                Enter a GitHub repository URL and let Git Friend analyze your codebase to generate professional
                documentation in seconds.
              </p>
            </motion.div>

            {error && (
              <motion.div
                className="max-w-3xl mx-auto mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <motion.div
              className="max-w-3xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onMouseEnter={() => setHoverState((prev) => ({ ...prev, card: true }))}
              onMouseLeave={() => setHoverState((prev) => ({ ...prev, card: false }))}
            >
              {/* Stepper/Progress Bar */}
              {/* 1. Remove the horizontal stepper/progress bar (delete the <div> with stepper code) */}
              {/* 2. Enhance the input section card: add a header, info icons, more padding, modern border/shadow, better layout */}
              {/* 3. Make custom instructions area more prominent */}
              {/* 4. Improve button layout for Generate/Regenerate */}
              {/* 5. Enhance the generated README card: modern border/shadow, sticky action bar, better markdown font/spacing, subtle animations */}
              {/* 6. Ensure mobile responsiveness */}
              <Card
                className={`border-[hsl(var(--readme-border))] bg-[hsl(var(--readme-card-bg))] shadow-lg overflow-hidden transition-all duration-300 ${
                  hoverState.card ? "shadow-xl border-[hsl(var(--readme-primary))/30]" : ""
                }`}
              >
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-[hsl(var(--readme-primary))/20] flex items-center justify-center">
                        <GitBranch className="h-5 w-5 text-[hsl(var(--readme-primary))]" />
                      </div>
                      <span className="text-xl font-medium">Generate Your README</span>
                    </div>
                  </div>

                  <p className="text-[hsl(var(--readme-text-muted))] text-sm mb-6">
                    Enter a GitHub repository URL to analyze code and generate a detailed README file that explains what
                    your project does, why it exists, and how to use it.
                  </p>

                  <div className="relative mb-6 group">
                    <div className="absolute inset-0 rounded-md -m-1 bg-gradient-to-r from-[hsl(var(--readme-primary))/0] via-[hsl(var(--readme-primary))/50] to-[hsl(var(--readme-primary))/0] opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--readme-text-muted))]">
                      <Github className="h-5 w-5" />
                    </div>
                    <input
                      className="w-full h-12 bg-[hsl(var(--readme-card-bg))] border border-[hsl(var(--readme-border))] rounded-md px-10 py-2 text-[hsl(var(--readme-text))] placeholder:text-[hsl(var(--readme-text-muted))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--readme-primary))] relative"
                      placeholder="https://github.com/username/repository"
                      value={repoUrl}
                      onChange={(e) => {
                        setRepoUrl(e.target.value)
                        // Auto-start generation when valid URL is pasted
                        if (validateRepoUrl(e.target.value) && !isGenerating && !generatedReadme) {
                          setTimeout(() => fetchRepoData(false), 500) // Small delay to allow paste to complete
                        }
                      }}
                      onKeyDown={handleKeyDown}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      className={`bg-[hsl(var(--readme-primary))] hover:bg-[hsl(var(--readme-primary-hover))] text-[hsl(var(--readme-primary-foreground))] px-6 py-2 rounded-md flex items-center gap-2 transition-all duration-300 ${
                        hoverState.button ? "shadow-lg shadow-[hsl(var(--readme-primary))/20] scale-105" : ""
                      }`}
                      onClick={() => fetchRepoData(false)}
                      disabled={isGenerating || !repoUrl}
                      onMouseEnter={() => setHoverState((prev) => ({ ...prev, button: true }))}
                      onMouseLeave={() => setHoverState((prev) => ({ ...prev, button: false }))}
                    >
                      {isGenerating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                          />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          Generate README
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Example repositories */}
            {!generatedReadme && !isGenerating && (
              <motion.div
                className="max-w-3xl mx-auto mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-lg font-medium mb-4 text-center">Try with popular repositories</h3>
                <div className="grid grid-cols-3 gap-4">
                  {exampleRepos.map((repo, index) => (
                    <Card
                      key={index}
                      className={`border-[hsl(var(--readme-border))] bg-[hsl(var(--readme-card-bg))] cursor-pointer hover:bg-[hsl(var(--readme-bg))] transition-all duration-300 ${
                        hoverState.examples[index]
                          ? "shadow-md border-[hsl(var(--readme-primary))/30] scale-[1.02]"
                          : ""
                      }`}
                      onClick={() => handleExampleClick(repo.owner)}
                      onMouseEnter={() => {
                        const newExamples = [...hoverState.examples]
                        newExamples[index] = true
                        setHoverState((prev) => ({ ...prev, examples: newExamples }))
                      }}
                      onMouseLeave={() => {
                        const newExamples = [...hoverState.examples]
                        newExamples[index] = false
                        setHoverState((prev) => ({ ...prev, examples: newExamples }))
                      }}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[hsl(var(--readme-primary))/20] flex items-center justify-center">
                          {repo.icon}
                        </div>
                        <div>
                          <div className="font-medium">{repo.name}</div>
                          <div className="text-xs text-[hsl(var(--readme-text-muted))]">{repo.owner}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {generatedReadme && (
              <>
                <motion.div
                  className="max-w-5xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-[hsl(var(--readme-card-bg))] border border-[hsl(var(--readme-border))]">
                      <TabsTrigger
                        value="preview"
                        className="flex items-center gap-2 data-[state=active]:bg-[hsl(var(--readme-primary))] data-[state=active]:text-[hsl(var(--readme-primary-foreground))]"
                      >
                        <BookOpen className="h-4 w-4" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger
                        value="markdown"
                        className="flex items-center gap-2 data-[state=active]:bg-[hsl(var(--readme-primary))] data-[state=active]:text-[hsl(var(--readme-primary-foreground))]"
                      >
                        <FileText className="h-4 w-4" />
                        Markdown
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview">
                      <MarkdownPreview
                        markdown={generatedReadme}
                        onNew={() => {
                          setRepoUrl("")
                          setGeneratedReadme("")
                          setRepoData(null)
                        }}
                        onDownload={downloadReadme}
                        onCopy={copyToClipboard}
                        onRegenerate={() => fetchRepoData(true)}
                        canRegenerate={!isGenerating && !!repoUrl}
                        copied={copied}
                      />
                    </TabsContent>

                    <TabsContent value="markdown">
                      <Card className="relative shadow-lg border-[hsl(var(--readme-border))] bg-[hsl(var(--readme-card-bg))]">
                        <CardContent className="pt-6">
                          <div className="absolute top-4 right-4 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 border-[hsl(var(--readme-border))]  hover:bg-[hsl(var(--readme-bg))] bg-transparent"
                              onClick={() => {
                                setRepoUrl("")
                                setGeneratedReadme("")
                                setRepoData(null)
                              }}
                            >
                              <GitBranch className="h-4 w-4" />
                              New
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 border-[hsl(var(--readme-border))] hover:bg-[hsl(var(--readme-bg))] bg-transparent"
                              onClick={downloadReadme}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 border-[hsl(var(--readme-border))] hover:bg-[hsl(var(--readme-bg))] bg-transparent"
                              onClick={copyToClipboard}
                            >
                              {copied ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <ScrollArea className="h-[600px] pr-4 mt-8">
                            <pre className="bg-[hsl(var(--readme-bg))] p-4 rounded-lg overflow-x-auto text-sm font-mono">
                              <code>{generatedReadme}</code>
                            </pre>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              </>
            )}
          </div>

          {/* Show streaming README as it's being generated */}
          {isGenerating && !generatedReadme && (
            <motion.div
              className="max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-[hsl(var(--readme-border))] bg-[hsl(var(--readme-card-bg))] shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-6 w-6 border-2 border-[hsl(var(--readme-primary))] border-t-transparent rounded-full"
                    />
                    <span className="text-lg font-medium">Generating README...</span>
                  </div>
                  <p className="text-center text-[hsl(var(--readme-text-muted))] text-sm">
                    Analyzing your repository and creating documentation
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>
      {/* Guest session expired modal */}
      {showGuestExpired && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-2">Guest Session Expired</h2>
            <p className="mb-4 text-gray-600">
              Your 5-minute guest session has ended. Please sign in to continue using Git Friend.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Sign In
            </Button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
