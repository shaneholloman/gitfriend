"use client"

import { memo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { DecoratedRepo } from "@/lib/fetchRepos"

type Props = {
  items: DecoratedRepo[]
  loading?: boolean
  error?: string
  onEndReached?: () => void
}

export const OssTable = memo(function OssTable({ items, loading, error, onEndReached }: Props) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!onEndReached) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) onEndReached()
        })
      },
      { rootMargin: "400px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [onEndReached])

  return (
    <div className="rounded-lg border bg-card/30 backdrop-blur">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[42%]">Repository</TableHead>
            <TableHead>Language</TableHead>
            <TableHead className="w-[28%]">Tags</TableHead>
            <TableHead className="text-right">Stars</TableHead>
            <TableHead className="text-right">Forks</TableHead>
            <TableHead className="text-right">Popularity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence initial={false}>
            {items.map((repo) => (
              <motion.tr
                key={repo.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.2 }}
                className="border-b last:border-0"
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-6 w-6 overflow-hidden rounded">
                      <Image
                        src={repo.owner.avatar_url || "/placeholder.svg?height=24&width=24&query=repo%20avatar"}
                        alt="owner avatar"
                        fill
                      />
                    </div>
                    <div className="min-w-0">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="truncate font-medium hover:underline"
                      >
                        {repo.full_name}
                      </a>
                      <div className="truncate text-xs text-muted-foreground">{repo.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  {repo.language ? (
                    <Badge variant="outline">{repo.language}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-wrap gap-2">
                    {repo.tags.slice(0, 5).map((t) => (
                      <Badge key={t} variant="secondary" className="bg-muted/60">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="py-4 text-right tabular-nums">{formatCount(repo.stargazers_count)}</TableCell>
                <TableCell className="py-4 text-right tabular-nums">{formatCount(repo.forks_count)}</TableCell>
                <TableCell className="py-4 text-right">
                  <Badge className={popularityClass(repo.popularity)}>{repo.popularity}</Badge>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>

          {loading && <LoadingRows />}
          {error && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-sm text-destructive">
                {error}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* sentinel for infinite scroll */}
      <div ref={sentinelRef} />
    </div>
  )
})

function popularityClass(pop: DecoratedRepo["popularity"]) {
  switch (pop) {
    case "Legendary":
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
    case "Famous":
      return "bg-purple-500/15 text-purple-300 border-purple-500/30"
    case "Rising":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    default:
      return ""
  }
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${n}`
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={`sk-${i}`}>
          <TableCell colSpan={6} className="py-3">
            <Skeleton className="h-6 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
