"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ClientOnly } from "@/components/ui/client-only"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Home, TrendingUp, Compass, Star, GitFork, ChevronRight } from "lucide-react"

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
}

interface Filters {
  search: string
  language: string
  minStars: string
  sortBy: string
}

export default function OpenSourcePage() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState("home")
  const [hoveredRepo, setHoveredRepo] = useState<number | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: "",
    language: "all",
    minStars: "any",
    sortBy: "stars",
  })

  useEffect(() => {
    fetchRepositories()
  }, [filters])

  const fetchRepositories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("search", filters.search || "")
      params.append("language", filters.language || "all")
      params.append("minStars", filters.minStars || "any")
      params.append("sortBy", filters.sortBy || "stars")

      const response = await fetch(`/api/opensource?${params.toString()}`)
      const data = await response.json()
      setRepositories(data.repositories || [])
    } catch (error) {
      console.error("Error fetching repositories:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k"
    }
    return num.toString()
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      Go: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      TypeScript: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      JavaScript: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Python: "bg-green-500/20 text-green-400 border-green-500/30",
      Java: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "C++": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Rust: "bg-red-500/20 text-red-400 border-red-500/30",
      PHP: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    }
    return colors[language] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }

  const getPopularityBadge = (stars: number, index: number) => {
    if (index < 3) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">Legendary</Badge>
      )
    }
    return <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium">Famous</Badge>
  }

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "discover", label: "Discover", icon: Compass },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col md:flex-row md:overflow-hidden">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:flex w-64 border-r border-white/10 p-6 flex-col flex-shrink-0">
        <div className="space-y-8 flex-1">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">General</p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                      activeNav === item.id
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {activeNav === item.id && <ChevronRight className="w-4 h-4" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav (top) */}
      <div className="md:hidden w-full border-b border-white/10 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                  active ? "bg-white/10 text-white" : "text-gray-400 bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:overflow-hidden">
        {/* Filters - Fixed Header */}
        <div className="flex-shrink-0 p-4 md:p-8 pb-3 md:pb-4 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <ClientOnly fallback={<div className="w-full h-10 rounded-lg bg-white/5 border border-white/10" />}>
              <div className="w-full relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search repositories..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/10 transition-colors backdrop-blur-xl"
                />
              </div>
            </ClientOnly>

            <ClientOnly
              fallback={
                <>
                  <div className="w-full sm:w-40 h-10 rounded-lg bg-white/5 border border-white/10" />
                  <div className="w-full sm:w-40 h-10 rounded-lg bg-white/5 border border-white/10" />
                </>
              }
            >
              <Select value={filters.language} onValueChange={(value) => setFilters({ ...filters, language: value })}>
                <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white backdrop-blur-xl">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="TypeScript">TypeScript</SelectItem>
                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                  <SelectItem value="Python">Python</SelectItem>
                  <SelectItem value="Go">Go</SelectItem>
                  <SelectItem value="Java">Java</SelectItem>
                  <SelectItem value="Rust">Rust</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white backdrop-blur-xl">
                  <SelectValue placeholder="All Popularity" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  <SelectItem value="stars">Most Stars</SelectItem>
                  <SelectItem value="forks">Most Forks</SelectItem>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </ClientOnly>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 pt-3 md:pt-4">
          <div className="max-w-7xl mx-auto">
            {/* Table */}
            <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 md:p-4 font-medium text-gray-400 text-xs md:text-sm">Repository</th>
                      <th className="text-left p-3 md:p-4 font-medium text-gray-400 text-xs md:text-sm">Language</th>
                      <th className="hidden lg:table-cell text-left p-4 font-medium text-gray-400 text-sm">Tags</th>
                      <th className="text-right p-3 md:p-4 font-medium text-gray-400 text-xs md:text-sm">Stars</th>
                      <th className="hidden sm:table-cell text-right p-4 font-medium text-gray-400 text-sm">Forks</th>
                      <th className="hidden xl:table-cell text-left p-4 font-medium text-gray-400 text-sm">
                        Popularity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 10 }).map((_, index) => (
                        <tr key={index} className="border-b border-white/5">
                          <td className="p-3 md:p-4">
                            <div className="flex items-center space-x-3">
                              <Skeleton className="w-8 h-8 rounded-full bg-white/10" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-32 bg-white/10" />
                                <Skeleton className="h-3 w-20 bg-white/10" />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 md:p-4">
                            <Skeleton className="h-6 w-20 rounded-md bg-white/10" />
                          </td>
                          <td className="hidden lg:table-cell p-4">
                            <div className="flex space-x-2">
                              <Skeleton className="h-5 w-16 rounded bg-white/10" />
                              <Skeleton className="h-5 w-20 rounded bg-white/10" />
                            </div>
                          </td>
                          <td className="p-3 md:p-4 text-right">
                            <Skeleton className="h-4 w-12 ml-auto bg-white/10" />
                          </td>
                          <td className="hidden sm:table-cell p-4 text-right">
                            <Skeleton className="h-4 w-12 ml-auto bg-white/10" />
                          </td>
                          <td className="hidden xl:table-cell p-4">
                            <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <TooltipProvider>
                        {repositories.map((repo, index) => (
                          <tr
                            key={repo.id}
                            className="border-b border-white/5 hover:bg-white/5 transition-all duration-200"
                          >
                            <td
                              className="p-3 md:p-4 relative"
                              onMouseEnter={() => setHoveredRepo(repo.id)}
                              onMouseLeave={() => setHoveredRepo(null)}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 group cursor-pointer"
                                  >
                                    <Avatar className="w-8 h-8 ring-1 ring-white/10 transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-400/50 group-hover:scale-110">
                                      <AvatarImage
                                        src={repo.owner.avatar_url || "/placeholder.svg"}
                                        alt={`${repo.owner.login} avatar`}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="bg-white/10 text-white text-sm font-medium">
                                        {repo.owner.login.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-white group-hover:text-blue-400 transition-colors duration-200">
                                        {repo.name}
                                      </div>
                                      <div className="text-sm text-gray-500">{repo.owner.login}</div>
                                    </div>
                                  </a>
                                </TooltipTrigger>
                                {repo.description ? (
                                  <TooltipContent side="right" sideOffset={8} className="max-w-xs">
                                    <div className="flex items-start gap-3">
                                      <Avatar className="w-8 h-8 ring-1 ring-border/40">
                                        <AvatarImage
                                          src={repo.owner.avatar_url || "/placeholder.svg"}
                                          alt={`${repo.owner.login} avatar`}
                                        />
                                        <AvatarFallback className="text-xs">
                                          {repo.owner.login.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">{repo.owner.login}</p>
                                        <p className="text-sm leading-relaxed">{repo.description}</p>
                                        <div className="flex items-center gap-3 pt-1">
                                          <span className="inline-flex items-center gap-1 text-xs">
                                            <Star className="w-3.5 h-3.5 text-yellow-400" />
                                            {formatNumber(repo.stargazers_count)}
                                          </span>
                                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            <GitFork className="w-3.5 h-3.5" />
                                            {formatNumber(repo.forks_count)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                ) : null}
                              </Tooltip>
                            </td>
                            <td className="p-4">
                              {repo.language && (
                                <Badge className={`${getLanguageColor(repo.language)} border font-medium`}>
                                  {repo.language}
                                </Badge>
                              )}
                            </td>
                            <td className="hidden lg:table-cell p-4">
                              <div className="flex flex-wrap gap-1.5">
                                {repo.topics?.slice(0, 3).map((topic) => (
                                  <Badge
                                    key={topic}
                                    className="bg-white/5 text-gray-400 border border-white/10 text-xs font-normal hover:bg-white/10 transition-colors"
                                  >
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <span className="text-white font-medium">{formatNumber(repo.stargazers_count)}</span>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell p-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <span className="text-gray-400 font-medium">{formatNumber(repo.forks_count)}</span>
                              </div>
                            </td>
                            <td className="hidden xl:table-cell p-4">
                              {getPopularityBadge(repo.stargazers_count, index)}
                            </td>
                          </tr>
                        ))}
                      </TooltipProvider>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
