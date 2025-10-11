'use client'

import { useState, useCallback, useMemo } from 'react'
import { fetchRepositoriesServer, refreshCache, getCacheStats } from '@/lib/actions/repos'
import type { OssSearchParams } from '@/lib/fetchRepos'

export interface Repository {
  id: number
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  owner: { avatar_url?: string }
}

export interface UseRepositoriesReturn {
  repositories: Repository[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  isCached: boolean
  cacheStats: any
  loadMore: () => void
  refresh: () => Promise<void>
  search: (params: OssSearchParams) => void
}

export function useRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [isCached, setIsCached] = useState(false)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [currentParams, setCurrentParams] = useState<OssSearchParams>({
    q: '',
    language: 'all',
    difficulty: 'all',
    sort: 'popular',
    order: 'desc',
    page: 1,
    perPage: 20,
  })

  // Fetch cache stats
  const fetchCacheStats = useCallback(async () => {
    try {
      const result = await getCacheStats()
      if (result.success) {
        setCacheStats(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error)
    }
  }, [])

  // Search function
  const search = useCallback(async (params: OssSearchParams) => {
    setCurrentParams(params)
    setIsLoading(true)
    setError(null)
    setRepositories([])
    setHasMore(true)
    setTotalCount(0)

    try {
      const result = await fetchRepositoriesServer(params)
      
      if (result.success) {
        setRepositories(result.data.items)
        setHasMore(!result.data.end)
        setTotalCount(result.data.totalCount)
        setIsCached(result.data.cached)
      } else {
        setError(result.error || 'Failed to fetch repositories')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load more function
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      const nextPage = currentParams.page + 1
      const result = await fetchRepositoriesServer({
        ...currentParams,
        page: nextPage,
      })

      if (result.success) {
        setRepositories(prev => [...prev, ...result.data.items])
        setHasMore(!result.data.end)
        setCurrentParams(prev => ({ ...prev, page: nextPage }))
        setIsCached(result.data.cached)
      } else {
        setError(result.error || 'Failed to load more repositories')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [currentParams, isLoading, hasMore])

  // Refresh function
  const refresh = useCallback(async () => {
    if (!currentParams.q) return

    try {
      const result = await refreshCache(currentParams.q)
      if (result.success) {
        // Re-fetch the current search
        await search(currentParams)
        await fetchCacheStats()
      } else {
        setError(result.error || 'Failed to refresh cache')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh')
    }
  }, [currentParams, search, fetchCacheStats])

  // Load cache stats on mount
  useMemo(() => {
    fetchCacheStats()
  }, [fetchCacheStats])

  return {
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
  }
}
