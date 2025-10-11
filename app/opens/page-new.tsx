"use client"

import { useCallback, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Filters } from "@/components/opens/Filters"
import { OssTable } from "@/components/opens/Table"
import { decorateRepo, type OssSearchParams } from "@/lib/fetchRepos"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Database, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRepositories } from "@/lib/hooks/useRepositories"

export default function OpenSourceExplorerPage() {
  const paramsRef = useRef<OssSearchParams>({
    q: "",
    language: "all",
    difficulty: "all",
    sort: "popular",
    order: "desc",
    perPage: 20,
  })
  
  const {
    repositories,
    isLoading,
    error,
    hasMore,
    totalCount,
    isCached,
    cacheStats,
    loadMore,
    refresh,
    search,
  } = useRepositories()

  // Transform repositories for display
  const decoratedRepos = repositories.map(decorateRepo)

  const onParamsChange = useCallback(
    async (next: OssSearchParams) => {
      paramsRef.current = next
      await search(next)
    },
    [search],
  )

  const handleRefresh = useCallback(async () => {
    await refresh()
  }, [refresh])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Open Source Explorer
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Discover amazing open source projects to contribute to
          </p>
          
          {/* Cache Status and Refresh Button */}
          <motion.div
            className="mt-4 flex items-center justify-between"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <div className="flex items-center gap-4">
              {cacheStats && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Database className="w-4 h-4" />
                  <span>{cacheStats.repositories} repos cached</span>
                  {cacheStats.needsRefresh && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      <Clock className="w-3 h-3 mr-1" />
                      Stale
                    </Badge>
                  )}
                  {isCached && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Cached
                    </Badge>
                  )}
                </div>
              )}
              
              {totalCount > 0 && (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {totalCount.toLocaleString()} repositories found
                </div>
              )}
            </div>
            
            <Button
              onClick={handleRefresh}
              disabled={isLoading || !paramsRef.current.q}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Cache
            </Button>
          </motion.div>
        </motion.div>

        {error && (
          <motion.div
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Filters onParamsChange={onParamsChange} />
          </div>
          <div className="lg:col-span-3">
            <OssTable
              data={decoratedRepos}
              isLoading={isLoading}
              isValidating={false}
              onLoadMore={loadMore}
              hasMore={hasMore}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
