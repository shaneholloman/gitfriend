"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClientOnly } from "@/components/ui/client-only"
import { Search, Home, TrendingUp, Compass, ChevronRight, PanelLeftOpen, PanelLeft } from "lucide-react"
import { HomeSection } from "@/components/opensource/home-section"
import { BeamsBackground } from "@/components/opensource/bg-beams"
import { TrendingSection } from "@/components/opensource/trending-section"
import { DiscoverSection } from "@/components/opensource/discover-section"
import { News, type NewsArticle } from "@/components/ui/sidebar-news"

type Repo = {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  stargazers_count: number
  forks_count: number
  topics: string[]
  html_url: string
  owner: { login: string; avatar_url: string }
}

const NEWS_ARTICLES: NewsArticle[] = [
  {
    href: "https://github.com/krishn404/Git-Friend",
    title: "Git-Friend v2.0 Released!",
    summary: "New AI-powered features, enhanced README generation, and improved Git workflow assistance. Check out the latest updates!",
    image: "mesh-gradient-1",
  },
  {
    href: "https://github.com/krishn404/Git-Friend/discussions",
    title: "Promote Your Repository",
    summary: "Want to showcase your amazing open-source project? DM us to get featured in our trending repositories section!",
    image: "mesh-gradient-2",
  },
  {
    href: "https://github.com/krishn404/Git-Friend/issues",
    title: "New Git Emoji Generator",
    summary: "Create expressive commit messages with our enhanced emoji generator. Make your Git history more readable and fun!",
    image: "mesh-gradient-3",
  },
  {
    href: "https://github.com/krishn404/Git-Friend/releases",
    title: "AI Chat Improvements",
    summary: "Our AI assistant now understands more Git commands and provides better context-aware suggestions for your workflow.",
    image: "mesh-gradient-4",
  },
  {
    href: "https://github.com/krishn404/Git-Friend/wiki",
    title: "Community Spotlight",
    summary: "Share your success stories with Git-Friend! How has it improved your development workflow? We'd love to hear from you.",
    image: "mesh-gradient-5",
  },
]

export default function OpenSourcePage() {
  const [repositories, setRepositories] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeNav, setActiveNav] = useState<"home" | "trending" | "discover">("home")
  const [trendingPeriod, setTrendingPeriod] = useState<"day" | "month" | "year">("day")
  const [hoveredRepo, setHoveredRepo] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    language: "all",
    minStars: "any",
    sortBy: "stars",
  })

  // Debounced sidebar toggle to prevent rapid clicking
  const toggleSidebar = () => {
    if (isTransitioning) return
    
    setIsTransitioning(true)
    setSidebarOpen(!sidebarOpen)
    
    // Reset transition lock after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }

  useEffect(() => {
    fetchRepositories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeNav, trendingPeriod])

  const fetchRepositories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (activeNav === "trending") {
        params.append("trending", "1")
        params.append("trendingPeriod", trendingPeriod)
        params.append("sortBy", "stars")
      } else {
        // home & discover share base search; discover emphasizes recent activity
        params.append("search", filters.search || "")
        params.append("language", filters.language || "all")
        params.append("minStars", filters.minStars || "any")
        params.append("sortBy", activeNav === "discover" ? "updated" : filters.sortBy || "stars")
      }

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

  const renderRankBadge = (index: number) => {
    if (index > 2) return null
    const labels = ["1st", "2nd", "3rd"]
    const styles = [
      "bg-[hsl(var(--muted)/0.2)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.4)]",
      "bg-[hsl(var(--muted)/0.18)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.35)]",
      "bg-[hsl(var(--muted)/0.16)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.3)]",
    ]
    return <Badge className={`${styles[index]} font-semibold px-2 py-0.5`}>{labels[index]}</Badge>
  }

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "discover", label: "Discover", icon: Compass },
  ] as const

  return (
    <div className="relative min-h-screen text-white">
      <BeamsBackground className="fixed inset-0 -z-10" />
      <div className="relative flex md:overflow-hidden" style={{ contain: "layout" }}>
        <aside
          className={[
            "sidebar-container sidebar-transition fixed z-20 top-0 left-0 h-screen w-64 border-r border-white/10 p-6 flex-col bg-black/40 backdrop-blur-md",
            "hidden md:flex",
          ].join(" ")}
          style={{
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          }}
          aria-hidden={!sidebarOpen}
        >
          {/* Sidebar Header with Panel Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Git Friend</h2>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close sidebar"
              disabled={isTransitioning}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-8 flex-1 overflow-y-auto">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">General</p>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeNav === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                        isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                      aria-pressed={isActive}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* News Section */}
          <div className="mt-8">
            <News articles={NEWS_ARTICLES} />
          </div>
        </aside>

        <main
          className="main-content main-transition flex-1 flex flex-col min-h-screen relative"
          style={{
            marginLeft: sidebarOpen ? "256px" : "0px",
          }}
        >
          <div className="sticky top-0 z-30 backdrop-blur-lg bg-black/30 border-b border-white/10">
            <div className="px-4 md:px-8 py-3 flex items-center justify-between min-h-[60px]">
              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="hidden md:inline-flex items-center justify-center p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Open sidebar"
                  disabled={isTransitioning}
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </button>
              )}

              <div className="md:hidden w-full">
                <div className="flex gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                        aria-pressed={active}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="px-4 md:px-8 pb-3 md:pb-4">
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

                {activeNav !== "trending" && (
                  <ClientOnly
                    fallback={
                      <>
                        <div className="w-full sm:w-40 h-10 rounded-lg bg-white/5 border border-white/10" />
                        <div className="w-full sm:w-40 h-10 rounded-lg bg-white/5 border border-white/10" />
                      </>
                    }
                  >
                    <Select
                      value={filters.language}
                      onValueChange={(value) => setFilters({ ...filters, language: value })}
                    >
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
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10 text-white">
                        <SelectItem value="stars">Most Stars</SelectItem>
                        <SelectItem value="forks">Most Forks</SelectItem>
                        <SelectItem value="updated">Recently Updated</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </ClientOnly>
                )}

                {activeNav === "trending" && (
                  <div className="flex items-center gap-2">
                    {(["day", "month", "year"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setTrendingPeriod(p)}
                        className={[
                          "px-3 py-2 rounded-md text-xs sm:text-sm border transition-colors",
                          trendingPeriod === p
                            ? "bg-white/10 text-white border-white/20"
                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                        aria-pressed={trendingPeriod === p}
                      >
                        {p === "day" ? "Day" : p === "month" ? "Month" : "Year"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-3 md:mb-4 text-sm text-gray-400">
                {activeNav === "home" && <span>Home • Explore and filter repositories</span>}
                {activeNav === "trending" && <span>Trending • Top repositories by {trendingPeriod}</span>}
                {activeNav === "discover" && <span>Discover • Recently active repositories</span>}
              </div>

              {activeNav === "home" && <HomeSection repositories={repositories} loading={loading} />}
              {activeNav === "trending" && (
                <>
                  <TrendingSection repositories={repositories} loading={loading} />
                </>
              )}
              {activeNav === "discover" && <DiscoverSection repositories={repositories} loading={loading} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
