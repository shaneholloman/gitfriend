"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  ArrowUp,
  Copy,
  Check,
  Sun,
  Moon,
  Mic,
  Search,
  GitBranch,
  GitMerge,
  GitPullRequest,
  GitCommit,
  Clock,
  Zap,
  GitGraph,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useTheme } from "next-themes"
import { format } from "date-fns"
import { Message, MessageAvatar, MessageContent, MessageActions, MessageAction } from "@/components/ui/message"
import { SuggestionCard } from "@/components/ui/suggestion-card"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
  id: string
  timestamp: Date
  feedback?: "like" | "dislike" | null
}

type SuggestionCardProps = {
  icon: React.ReactNode
  title: string
  description: string
  prompt: string
  color: string
  keywords: string[] // Add keywords for filtering
}

export default function AIChat() {
  const suggestionCards: SuggestionCardProps[] = [
    {
      icon: <GitBranch className="h-5 w-5" />,
      title: "Git Branching",
      description: "Learn about creating and managing branches",
      prompt: "How do I create and manage branches in Git?",
      color: "text-primary",
      keywords: ["branch", "create", "switch", "checkout", "git branch"],
    },
    {
      icon: <GitMerge className="h-5 w-5" />,
      title: "Merge Conflicts",
      description: "Resolve conflicts when merging branches",
      prompt: "How do I resolve merge conflicts in Git?",
      color: "text-primary",
      keywords: ["merge", "conflict", "resolve", "git merge"],
    },
    {
      icon: <GitPullRequest className="h-5 w-5" />,
      title: "Pull Requests",
      description: "Create and manage pull requests",
      prompt: "What's the best way to create a pull request on GitHub?",
      color: "text-primary",
      keywords: ["pull request", "pr", "github", "review"],
    },
    {
      icon: <GitCommit className="h-5 w-5" />,
      title: "Commit Best Practices",
      description: "Write better commit messages",
      prompt: "What are some best practices for writing good commit messages?",
      color: "text-primary",
      keywords: ["commit", "message", "best practice", "git commit"],
    },
  ]
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamContent, setStreamContent] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const [filteredSuggestions, setFilteredSuggestions] = useState<SuggestionCardProps[]>(suggestionCards)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Hide welcome screen when there are messages
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false)
    } else {
      setShowWelcome(true)
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      id: Date.now().toString(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setStreamContent("") // Clear any previous streaming content

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: input }],
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch response")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("Response body is null")

      let accumulatedContent = ""

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunkText = new TextDecoder().decode(value)
            const lines = chunkText.split("\n\n")

            for (const line of lines) {
              if (!line.trim() || !line.startsWith("data:")) continue

              const data = line.replace("data:", "").trim()
              if (data === "[DONE]") break

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulatedContent += parsed.content
                  setStreamContent(accumulatedContent)
                }
              } catch (e) {
                console.error("Error parsing JSON from stream:", e, data)
              }
            }
          }

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: accumulatedContent,
              id: Date.now().toString(),
              timestamp: new Date(),
              feedback: null,
            },
          ])

          setIsLoading(false)
        } catch (error) {
          console.error("Error processing stream:", error)
          setIsLoading(false)
        }
      }

      processStream()
    } catch (error) {
      console.error("Error fetching response:", error)
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleFeedback = (id: string, type: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id === id) {
          return {
            ...message,
            feedback: message.feedback === type ? null : type,
          }
        }
        return message
      }),
    )
  }

  const handleSuggestionClick = async (prompt: string) => {
    const userMessage: ChatMessage = {
      role: "user",
      content: prompt,
      id: Date.now().toString(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setStreamContent("") // Clear any previous streaming content

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch response")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("Response body is null")

      let accumulatedContent = ""

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunkText = new TextDecoder().decode(value)
            const lines = chunkText.split("\n\n")

            for (const line of lines) {
              if (!line.trim() || !line.startsWith("data:")) continue

              const data = line.replace("data:", "").trim()
              if (data === "[DONE]") break

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulatedContent += parsed.content
                  setStreamContent(accumulatedContent)
                }
              } catch (e) {
                console.error("Error parsing JSON from stream:", e, data)
              }
            }
          }

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: accumulatedContent,
              id: Date.now().toString(),
              timestamp: new Date(),
              feedback: null,
            },
          ])

          setIsLoading(false)
        } catch (error) {
          console.error("Error processing stream:", error)
          setIsLoading(false)
        }
      }

      processStream()
    } catch (error) {
      console.error("Error fetching response:", error)
      setIsLoading(false)
    }
  }

  // Update suggestions based on input
  useEffect(() => {
    if (!input.trim()) {
      setFilteredSuggestions(suggestionCards)
      return
    }

    const filtered = suggestionCards.filter((card) => {
      const inputLower = input.toLowerCase()
      return (
        card.keywords.some((keyword) => keyword.toLowerCase().includes(inputLower)) ||
        card.title.toLowerCase().includes(inputLower) ||
        card.description.toLowerCase().includes(inputLower)
      )
    })

    setFilteredSuggestions(filtered)
  }, [input])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    // Filtering is handled by the useEffect above
  }

  // Format timestamp
  const formatMessageTime = (date: Date) => {
    return format(date, "h:mm a")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container max-w-full mx-auto px-4 md:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <GitBranch className="h-6 w-6 text-purple-500" />
              <span className="text-xl font-bold">Git Friend</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link href="/ai-chat" className="text-sm font-medium text-primary transition-colors">
              AI Chat
            </Link>
            <Link
              href="/generate-readme"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Generate Readme
            </Link>
            <Link
              href="/git-mojis"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
              className="text-muted-foreground hover:text-foreground"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="outline" size="sm" className="hidden md:flex">
              Log In
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative">
        {/* Chat messages area */}
        <div
          ref={chatContainerRef}
          className={cn(
            "flex-1 overflow-y-auto pb-40",
            showWelcome ? "flex items-center justify-center" : "",
            "bg-background",
          )}
        >
          {showWelcome ? (
            <div className="container max-w-full mx-auto px-4 md:px-8">
              <div className="text-center mb-10">
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6 relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl"></div>
                  <GitGraph className="h-12 w-12 text-primary relative z-10" />
                </div>
                <h1 className="text-4xl font-bold mb-4 text-foreground">
                  Git Friend <span className="text-primary">+ AI</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                  Powered by AI's ultra-fast LLM. Ask anything about Git and GitHub with lightning-fast responses!
                </p>
              </div>

              {/* Redesigned suggestion cards - 2x2 grid */}
              <div className="max-w-2xl mx-auto mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestionCards.map((card, index) => (
                    <SuggestionCard
                      key={index}
                      icon={card.icon}
                      title={card.title}
                      description={card.description}
                      onClick={() => handleSuggestionClick(card.prompt)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="container max-w-full mx-auto px-4 md:px-8 py-6">
              <div className="space-y-6">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Message
                      align={message.role === "user" ? "end" : "start"}
                      avatar={
                        message.role === "assistant" ? (
                          <MessageAvatar
                            className="hidden" // Hide avatar for cleaner look
                            fallback="AI"
                          />
                        ) : (
                          <MessageAvatar
                            className="hidden" // Hide avatar for cleaner look
                            fallback="You"
                          />
                        )
                      }
                    >
                      <div className="flex flex-col">
                        {message.role === "user" ? (
                          // User message
                          <div className="flex flex-col items-end">
                            <div className="flex items-center mb-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatMessageTime(message.timestamp)}
                            </div>
                            <MessageContent className="bg-[#8b5cf6] text-white rounded-2xl rounded-tr-sm shadow-sm">
                              {message.content}
                            </MessageContent>
                          </div>
                        ) : (
                          // AI message
                          <div className="flex flex-col">
                            <div className="flex items-center mb-1 text-xs text-muted-foreground">
                              <span className="font-medium mr-1">Git Friend</span> •{" "}
                              {formatMessageTime(message.timestamp)}
                            </div>
                            <MessageContent
                              className="bg-[#f9fafb] dark:bg-[#1f2937] border border-[#e5e7eb] dark:border-[#374151] rounded-2xl rounded-tl-sm shadow-sm"
                              markdown={true}
                            >
                              {message.content}
                            </MessageContent>

                            <div className="flex justify-end mt-2">
                              <MessageActions>
                                <MessageAction tooltip="Copy to clipboard">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                                    onClick={() => copyToClipboard(message.content, message.id)}
                                  >
                                    {copiedId === message.id ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </MessageAction>

                                <MessageAction tooltip="Helpful">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8 rounded-full",
                                      message.feedback === "like"
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                                    )}
                                    onClick={() => handleFeedback(message.id, "like")}
                                  >
                                    <ThumbsUp className="h-4 w-4" />
                                  </Button>
                                </MessageAction>

                                <MessageAction tooltip="Not helpful">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8 rounded-full",
                                      message.feedback === "dislike"
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                                    )}
                                    onClick={() => handleFeedback(message.id, "dislike")}
                                  >
                                    <ThumbsDown className="h-4 w-4" />
                                  </Button>
                                </MessageAction>
                              </MessageActions>
                            </div>
                          </div>
                        )}
                      </div>
                    </Message>
                  </motion.div>
                ))}

                {/* Response Stream */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Message align="start">
                      <div className="flex flex-col">
                        <div className="flex items-center mb-1 text-xs text-muted-foreground">
                          <span className="font-medium mr-1">Git Friend</span> • {formatMessageTime(new Date())}
                        </div>
                        <MessageContent
                          className="bg-[#f9fafb] dark:bg-[#1f2937] border border-[#e5e7eb] dark:border-[#374151] rounded-2xl rounded-tl-sm shadow-sm"
                          markdown={!!streamContent}
                        >
                          {streamContent || (
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                <Zap className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-sm text-muted-foreground">AI is thinking...</span>
                            </div>
                          )}
                        </MessageContent>
                      </div>
                    </Message>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Fixed input at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-background border-t border-border shadow-lg">
          <div className="container max-w-3xl mx-auto px-4 md:px-0">
            <form onSubmit={handleSubmit} className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="flex items-center justify-center bg-primary/10 rounded-full p-1.5 relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-md"></div>
                  <Zap className="h-4 w-4 text-primary relative z-10" />
                </div>
              </div>
              <div className="rounded-xl border border-input shadow-sm overflow-hidden bg-background transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 focus-within:opacity-100 transition-opacity"></div>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask AI about Git or GitHub..."
                  className="border-0 pl-16 pr-12 py-6 text-base focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-foreground relative z-10"
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                  {input.trim() ? (
                    <Button
                      type="submit"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 transition-colors"
                      disabled={isLoading}
                    >
                      <ArrowUp className="h-5 w-5 text-white" />
                    </Button>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                      <Search className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors ml-1" />
                    </>
                  )}
                </div>
              </div>
            </form>

            {!showWelcome && (
              <div className="mt-4">
                {input.trim() && filteredSuggestions.length > 0 && (
                  <div className="mb-2 text-xs text-muted-foreground">Suggestions based on your input:</div>
                )}
                <div className="flex flex-wrap gap-2">
                  {input.trim() ? (
                    filteredSuggestions.length > 0 ? (
                      filteredSuggestions.slice(0, 3).map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs bg-background hover:bg-muted transition-colors border-input hover:border-primary flex items-center gap-1.5 group-hover:border-primary text-foreground"
                            onClick={() => handleSuggestionClick(suggestion.prompt)}
                            disabled={isLoading}
                          >
                            <span className="h-4 w-4 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                              {suggestion.icon}
                            </span>
                            {suggestion.title}
                          </Button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground py-1">
                        No matching suggestions. Press Enter to send your message.
                      </div>
                    )
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs bg-background hover:bg-muted transition-colors border-input hover:border-primary flex items-center gap-1.5 text-foreground"
                        onClick={() => handleSuggestionClick("How do I create a branch in Git?")}
                        disabled={isLoading}
                      >
                        <span className="h-4 w-4 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                          <GitBranch className="h-3 w-3" />
                        </span>
                        Create a branch
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs bg-background hover:bg-muted transition-colors border-input hover:border-primary flex items-center gap-1.5 text-foreground"
                        onClick={() => handleSuggestionClick("How do I resolve merge conflicts?")}
                        disabled={isLoading}
                      >
                        <span className="h-4 w-4 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                          <GitMerge className="h-3 w-3" />
                        </span>
                        Resolve conflicts
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


