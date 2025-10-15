"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Star, GitFork } from "lucide-react"

export interface Repository {
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

function formatNumber(num: number) {
  if (num >= 1000) return (num / 1000).toFixed(1) + "k"
  return num.toString()
}

function getLanguageBadge(language?: string) {
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
  const cls = language && colors[language] ? colors[language] : "bg-gray-500/20 text-gray-400 border-gray-500/30"
  return language ? <Badge className={`${cls} border font-medium`}>{language}</Badge> : null
}

function RankBadge({ index }: { index: number }) {
  if (index > 2) return null
  const labels = ["1st", "2nd", "3rd"]
  const styles = [
    "bg-[hsl(var(--muted)/0.2)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.4)]",
    "bg-[hsl(var(--muted)/0.18)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.35)]",
    "bg-[hsl(var(--muted)/0.16)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.3)]",
  ]
  return <Badge className={`${styles[index]} font-semibold px-2 py-0.5`}>{labels[index]}</Badge>
}

function PopularityBadge({ stars, index }: { stars: number; index: number }) {
  if (index < 3) {
    return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">Legendary</Badge>
  }
  return <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium">Famous</Badge>
}

export function RepoTable({
  repositories,
  loading,
  showRank = false,
}: {
  repositories: Repository[]
  loading: boolean
  showRank?: boolean
}) {
  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 md:p-4 font-medium text-gray-400 text-xs md:text-sm">Repository</th>
              <th className="text-left p-3 md:p-4 font-medium text-gray-400 text-xs md:text-sm">
                {showRank ? "Rank" : "Language"}
              </th>
              <th className="hidden lg:table-cell text-left p-4 font-medium text-gray-400 text-sm">Tags</th>
              <th className="text-right p-3 md:p-4 font-medium text-gray-400 text-xs md:text-sm">Stars</th>
              <th className="hidden sm:table-cell text-right p-4 font-medium text-gray-400 text-sm">Forks</th>
              <th className="hidden xl:table-cell text-left p-4 font-medium text-gray-400 text-sm">Popularity</th>
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
                  <tr key={repo.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-200">
                    <td className="p-3 md:p-4 relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 group cursor-pointer"
                          >
                            <Avatar className="w-8 h-8 ring-1 ring-white/10 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/40 group-hover:scale-110">
                              <AvatarImage
                                src={
                                  repo.owner.avatar_url ||
                                  "/placeholder.svg?height=32&width=32&query=github%20avatar" ||
                                  "/placeholder.svg"
                                }
                                alt={`${repo.owner.login} avatar`}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-white/10 text-white text-sm font-medium">
                                {repo.owner.login.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-white group-hover:text-primary transition-colors duration-200">
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
                                  src={
                                    repo.owner.avatar_url ||
                                    "/placeholder.svg?height=32&width=32&query=github%20avatar" ||
                                    "/placeholder.svg"
                                  }
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
                    <td className="p-3 md:p-4">
                      {showRank ? <RankBadge index={index} /> : getLanguageBadge(repo.language)}
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
                    <td className="p-3 md:p-4 text-right">
                      <span className="text-white font-medium">{formatNumber(repo.stargazers_count)}</span>
                    </td>
                    <td className="hidden sm:table-cell p-4 text-right">
                      <span className="text-gray-400 font-medium">{formatNumber(repo.forks_count)}</span>
                    </td>
                    <td className="hidden xl:table-cell p-4">
                      <PopularityBadge stars={repo.stargazers_count} index={index} />
                    </td>
                  </tr>
                ))}
              </TooltipProvider>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
