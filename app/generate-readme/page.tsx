"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
  CheckCircle2,
  Lock,
  Lightbulb,
  X,
} from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import ReactMarkdown from "react-markdown"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { TextShimmerWave } from "@/components/core/text-shimmer-wave"

// Array of README tips
const readmeTips = [
  "GitHub's most starred README contains only emojis! 🌟",
  "Adding screenshots to your README can increase project adoption by up to 30%.",
  "A good README should answer: what, why, and how.",
  "Including a 'Quick Start' section helps new users get up and running faster.",
  "Badges in your README provide quick visual indicators of project status.",
  "Keep your installation instructions up-to-date to reduce onboarding friction.",
  "A table of contents helps users navigate longer READMEs.",
  "Including a contributing guide encourages community participation.",
]

// Array of README facts for the shimmer animation
const readmeFacts = [
  "Creating the perfect README...",
  "Analyzing your repository...",
  "Crafting documentation...",
  "Generating content...",
  "Building your project story...",
]

// Example repositories
const exampleRepos = [
  { name: "React", owner: "facebook/react", icon: <Code className="h-5 w-5" /> },
  { name: "Next.js", owner: "vercel/next.js", icon: <Zap className="h-5 w-5" /> },
  { name: "TailwindCSS", owner: "tailwindlabs/tailwindcss", icon: <Sparkles className="h-5 w-5" /> },
]

export default function GenerateReadme() {
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
  } | null>(null)
  const { theme, setTheme } = useTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [currentFactIndex, setCurrentFactIndex] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isPro, setIsPro] = useState(false)
  const [hoverState, setHoverState] = useState({
    card: false,
    button: false,
    examples: Array(exampleRepos.length).fill(false),
  })

  // Steps in the generation process
  const steps = [
    { name: "Fetching Repository", description: "Connecting to GitHub and retrieving repository data" },
    { name: "Analyzing Code Structure", description: "Examining files, folders, and dependencies" },
    { name: "Understanding Project", description: "Identifying frameworks, libraries, and project purpose" },
    { name: "Formatting Content", description: "Creating a well-structured README with all necessary sections" },
  ]

  // Rotate through tips during generation
  useEffect(() => {
    if (isGenerating) {
      const tipInterval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % readmeTips.length)
      }, 5000)

      const factInterval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % readmeFacts.length)
      }, 3000)

      return () => {
        clearInterval(tipInterval)
        clearInterval(factInterval)
      }
    }
  }, [isGenerating])

  // Handle escape key to close overlay
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showOverlay) {
        setShowOverlay(false)
        if (isGenerating) {
          setIsGenerating(false)
        }
      }
    }

    window.addEventListener("keydown", handleEscKey)
    return () => window.removeEventListener("keydown", handleEscKey)
  }, [showOverlay, isGenerating])

  // Handle click outside overlay content to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        setShowOverlay(false)
        if (isGenerating) {
          setIsGenerating(false)
        }
      }
    }

    if (showOverlay) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showOverlay, isGenerating])

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

  const fetchRepoData = async () => {
    if (!validateRepoUrl(repoUrl)) {
      alert("Please enter a valid GitHub repository URL")
      return
    }

    setIsGenerating(true)
    setShowOverlay(true)
    setCurrentStep(0)
    setProgress(0)
    setRepoData(null)

    try {
      // Extract owner and repo name from URL
      const urlParts = repoUrl.split("/")
      const owner = urlParts[urlParts.length - 2]
      const repo = urlParts[urlParts.length - 1].replace(".git", "")

      // Simulate fetching repository data
      setTimeout(() => {
        setRepoData({
          name: repo,
          description: "A sample repository description would appear here based on the actual GitHub data.",
          language: "TypeScript",
          stars: 42,
          forks: 13,
          owner: owner,
        })

        // Move to step 1 - Analyzing Code Structure
        setCurrentStep(1)
        setProgress(25)

        // Simulate code analysis
        setTimeout(() => {
          // Move to step 2 - Understanding Project
          setCurrentStep(2)
          setProgress(50)

          // Simulate project understanding
          setTimeout(() => {
            // Move to step 3 - Formatting Content
            setCurrentStep(3)
            setProgress(75)

            // Simulate content formatting
            setTimeout(() => {
              generateReadmeWithGroq(repo, owner)
            }, 3000)
          }, 3000)
        }, 3000)
      }, 3000)
    } catch (error) {
      console.error("Error fetching repository data:", error)
      setIsGenerating(false)
      setShowOverlay(false)
    }
  }

  const generateReadmeWithGroq = (repoName: string, owner: string) => {
    // Simulate Groq AI generating README
    setTimeout(() => {
      setProgress(100)

      const readme = `# ${repoName}

${repoData?.description || "A modern web application built with cutting-edge technologies."}

![GitHub stars](https://img.shields.io/github/stars/${owner}/${repoName}?style=social)
![GitHub forks](https://img.shields.io/github/forks/${owner}/${repoName}?style=social)
![GitHub issues](https://img.shields.io/github/issues/${owner}/${repoName}?style=social)

## Overview

This project is a ${repoData?.language || "TypeScript"} application that provides a seamless user experience for managing and interacting with data. It's designed with modern best practices and focuses on performance, accessibility, and developer experience.

## Features

- 🚀 **High Performance**: Optimized for speed and efficiency
- 🔒 **Secure**: Implements best security practices
- 📱 **Responsive**: Works on all devices and screen sizes
- ♿ **Accessible**: Follows WCAG guidelines for maximum accessibility
- 🌐 **Internationalized**: Ready for global audiences

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/${owner}/${repoName}.git

# Navigate to the project directory
cd ${repoName}

# Install dependencies
npm install

# Start the development server
npm run dev
\`\`\`

## Usage

After starting the development server, open your browser and navigate to \`http://localhost:3000\` to see the application in action.

\`\`\`typescript
// Example usage code
import { SomeComponent } from './${repoName}';

function App() {
  return <SomeComponent />;
}
\`\`\`

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/items\` | GET | Retrieve all items |
| \`/api/items/:id\` | GET | Retrieve a specific item |
| \`/api/items\` | POST | Create a new item |
| \`/api/items/:id\` | PUT | Update an existing item |
| \`/api/items/:id\` | DELETE | Delete an item |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc.

---

Generated with ❤️ by [Git Friend](https://gitfriend.dev)
`

      setGeneratedReadme(readme)

      // Keep overlay visible for a moment to show completion
      setTimeout(() => {
        setShowOverlay(false)
        setIsGenerating(false)
      }, 1500)
    }, 3000)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReadme)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExampleClick = (repo: string) => {
    setRepoUrl(`https://github.com/${repo}`)
  }

  return (
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
            <Button variant="outline" size="sm" className="hidden md:flex">
              Log In
            </Button>
            <Button size="sm">Sign Up</Button>
          </div>
        </div>
      </header>

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
              Accept repository details and let Git Friend analyze your codebase to generate professional documentation
              in seconds.
            </p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onMouseEnter={() => setHoverState((prev) => ({ ...prev, card: true }))}
            onMouseLeave={() => setHoverState((prev) => ({ ...prev, card: false }))}
          >
            <Card
              className={`border-[hsl(var(--readme-border))] bg-[hsl(var(--readme-card-bg))] shadow-lg overflow-hidden transition-all duration-300 ${
                hoverState.card ? "shadow-xl border-[hsl(var(--readme-primary))/30]" : ""
              }`}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[hsl(var(--readme-primary))/20] flex items-center justify-center">
                      <GitBranch className="h-4 w-4 text-[hsl(var(--readme-primary))]" />
                    </div>
                    <span className="text-lg font-medium">Generate Your README</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--readme-text-muted))]">Pro Version</span>
                    <button
                      className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${
                        isPro ? "bg-[hsl(var(--readme-primary))]" : "bg-[hsl(var(--readme-border))]"
                      }`}
                      onClick={() => setIsPro(!isPro)}
                    >
                      <motion.div
                        className="w-4 h-4 rounded-full bg-white"
                        animate={{ x: isPro ? 6 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>

                <p className="text-[hsl(var(--readme-text-muted))] text-sm mb-6">
                  Enter a GitHub repository URL to analyze code and generate a detailed README file.
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
                    onChange={(e) => setRepoUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                {isPro && (
                  <motion.div
                    className="mb-6 p-4 border border-[hsl(var(--readme-border))] rounded-md bg-[hsl(var(--readme-bg))/50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-[hsl(var(--readme-primary))]" />
                      <span className="text-sm font-medium">Pro Feature</span>
                    </div>
                    <p className="text-[hsl(var(--readme-text-muted))] text-xs mb-2">
                      Upgrade to Pro to customize your README with specific requirements and formatting preferences.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-[hsl(var(--readme-primary))]" />
                        <span className="text-xs">Custom sections</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-[hsl(var(--readme-primary))]" />
                        <span className="text-xs">Advanced templates</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end">
                  <Button
                    className={`bg-[hsl(var(--readme-primary))] hover:bg-[hsl(var(--readme-primary-hover))] text-[hsl(var(--readme-primary-foreground))] px-6 py-2 rounded-md flex items-center gap-2 transition-all duration-300 ${
                      hoverState.button ? "shadow-lg shadow-[hsl(var(--readme-primary))/20 scale-105" : ""
                    }`}
                    onClick={fetchRepoData}
                    disabled={isGenerating || !repoUrl}
                    onMouseEnter={() => setHoverState((prev) => ({ ...prev, button: true }))}
                    onMouseLeave={() => setHoverState((prev) => ({ ...prev, button: false }))}
                  >
                    <Zap className="h-4 w-4" />
                    Generate README
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
              <div className="grid grid-cols-3 gap-4">
                {exampleRepos.map((repo, index) => (
                  <Card
                    key={index}
                    className={`border-[hsl(var(--readme-border))] bg-[hsl(var(--readme-card-bg))] cursor-pointer hover:bg-[hsl(var(--readme-bg))] transition-all duration-300 ${
                      hoverState.examples[index] ? "shadow-md border-[hsl(var(--readme-primary))/30] scale-[1.02]" : ""
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
            <motion.div
              className="mt-8"
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
                  <Card className="relative shadow-lg border-[hsl(var(--readme-border))] bg-[hsl(var(--readme-card-bg))]">
                    <CardContent className="pt-6">
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 border-[hsl(var(--readme-border))] hover:bg-[hsl(var(--readme-bg))]"
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
                          className="flex items-center gap-2 border-[hsl(var(--readme-border))] hover:bg-[hsl(var(--readme-bg))]"
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
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{generatedReadme}</ReactMarkdown>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="markdown">
                  <Card className="relative shadow-lg border-[hsl(var(--readme-border))] bg-[hsl(var(--readme-card-bg))]">
                    <CardContent className="pt-6">
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 border-[hsl(var(--readme-border))] hover:bg-[hsl(var(--readme-bg))]"
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
                          className="flex items-center gap-2 border-[hsl(var(--readme-border))] hover:bg-[hsl(var(--readme-bg))]"
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
                        <pre className="bg-[hsl(var(--readme-bg))] p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{generatedReadme}</code>
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>

        {/* Overlay for generation process */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              ref={overlayRef}
              className="fixed inset-0 bg-[hsl(var(--readme-overlay-bg))] backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="bg-[hsl(var(--readme-card-bg))] border-2 border-[hsl(var(--readme-border))] rounded-xl shadow-xl max-w-2xl w-full p-8 relative"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <button
                  onClick={() => {
                    setShowOverlay(false)
                    setIsGenerating(false)
                  }}
                  className="absolute top-4 right-4 text-[hsl(var(--readme-text-muted))] hover:text-[hsl(var(--readme-text))] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex justify-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-[hsl(var(--readme-primary))/20] flex items-center justify-center">
                    <motion.div
                      animate={{
                        rotate: 360,
                        transition: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                      }}
                    >
                      <Sparkles className="h-8 w-8 text-[hsl(var(--readme-primary))]" />
                    </motion.div>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Creating Your README</h2>
                  <div className="h-8 overflow-hidden">
                    <TextShimmerWave
                      className="[--base-color:hsl(var(--readme-text))] [--base-gradient-color:hsl(var(--readme-primary))]"
                      duration={1}
                      spread={1}
                      zDistance={1}
                      scaleDistance={1.1}
                      rotateYDistance={20}
                    >
                      {readmeFacts[currentFactIndex]}
                    </TextShimmerWave>
                  </div>
                </div>

                {/* Random tip */}
                <div className="mb-8 text-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTipIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Lightbulb className="h-4 w-4 text-[hsl(var(--readme-primary))]" />
                      <span className="text-sm text-[hsl(var(--readme-text-muted))]">
                        {readmeTips[currentTipIndex]}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                  <div className="h-2 w-full bg-[hsl(var(--readme-border))] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[hsl(var(--readme-primary))]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-[hsl(var(--readme-text-muted))]">
                    <span>{steps[currentStep]?.name || "Analyzing"}</span>
                    <span>{progress}% Complete</span>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-md transition-all duration-300 ${
                        index === currentStep
                          ? "bg-[hsl(var(--readme-primary))/10 border border-[hsl(var(--readme-primary))/30]"
                          : index < currentStep
                            ? "opacity-60"
                            : "opacity-40"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                          index < currentStep
                            ? "bg-[hsl(var(--readme-primary))] text-white"
                            : index === currentStep
                              ? "bg-[hsl(var(--readme-primary))/20] text-[hsl(var(--readme-primary))]"
                              : "bg-[hsl(var(--readme-border))] text-[hsl(var(--readme-text-muted))]"
                        }`}
                      >
                        {index < currentStep ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <div
                          className={`font-medium ${
                            index <= currentStep
                              ? "text-[hsl(var(--readme-text))]"
                              : "text-[hsl(var(--readme-text-muted))]"
                          }`}
                        >
                          {step.name}
                        </div>
                        <div className="text-xs text-[hsl(var(--readme-text-muted))]">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

