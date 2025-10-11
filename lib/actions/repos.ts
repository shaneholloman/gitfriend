'use server'

import { GitHubCacheService } from '@/lib/services/github-cache'
import { Octokit } from '@octokit/rest'
import type { OssSearchParams } from '@/lib/fetchRepos'

const cacheService = new GitHubCacheService()

// Direct GitHub API fallback
const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
})

export async function fetchRepositoriesServer(params: OssSearchParams) {
  try {
    const { q = '', language = 'all', difficulty = 'all', sort = 'popular', order = 'desc', page = 1, perPage = 20 } = params
    
    // Build GitHub search query
    const searchQuery = buildGitHubQuery(q, language, difficulty)
    
    // Try cache first
    try {
      const cachedResult = await cacheService.getCachedRepositories({
        query: q,
        language,
        difficulty,
        sort: mapSortToGitHub(sort),
        order,
        page,
        perPage,
      })
      
      if (cachedResult.repositories.length > 0) {
        return {
          success: true,
          data: {
            items: cachedResult.repositories.map(transformRepo),
            end: !cachedResult.hasMore,
            totalCount: cachedResult.totalCount,
            cached: true,
          }
        }
      }
    } catch (cacheError) {
      console.warn('[Server] Cache miss, falling back to GitHub API:', cacheError)
    }
    
    // Fallback to GitHub API
    const response = await octokit.rest.search.repos({
      q: searchQuery,
      sort: mapSortToGitHub(sort),
      order: order === 'asc' ? 'asc' : 'desc',
      per_page: Math.min(perPage, 100),
      page,
    })
    
    const items = response.data.items.map(transformRepo)
    const end = page * perPage >= Math.min(1000, response.data.total_count)
    
    // Cache the results asynchronously
    if (q) {
      cacheService.fetchAndCacheRepositories(q, page, perPage).catch(console.error)
    }
    
    return {
      success: true,
      data: {
        items,
        end,
        totalCount: response.data.total_count,
        cached: false,
      }
    }
  } catch (error) {
    console.error('[Server] Error fetching repositories:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch repositories',
      data: { items: [], end: true, totalCount: 0, cached: false }
    }
  }
}

function buildGitHubQuery(q: string, language: string, difficulty: string): string {
  const parts: string[] = []
  
  if (q) parts.push(q)
  if (language !== 'all') parts.push(`language:${language}`)
  if (difficulty !== 'all') parts.push(`topic:${difficulty}`)
  
  // Always include these filters
  parts.push('is:public')
  parts.push('archived:false')
  
  return parts.join(' ')
}

function mapSortToGitHub(sort: string): 'stars' | 'forks' | 'updated' | 'created' {
  switch (sort) {
    case 'popular': return 'stars'
    case 'new': return 'created'
    case 'old': return 'created'
    case 'growing': return 'updated'
    default: return 'stars'
  }
}

function transformRepo(repo: any) {
  return {
    id: repo.id || repo.githubId,
    full_name: repo.full_name || repo.fullName,
    html_url: repo.html_url || repo.htmlUrl,
    description: repo.description,
    stargazers_count: repo.stargazers_count || repo.stargazersCount || 0,
    forks_count: repo.forks_count || repo.forksCount || 0,
    language: repo.language,
    topics: repo.topics || [],
    owner: { 
      avatar_url: repo.owner?.avatar_url || '' 
    },
  }
}

export async function refreshCache(query: string) {
  try {
    if (!query) {
      return { success: false, error: 'Query is required' }
    }
    
    await cacheService.fetchAndCacheRepositories(query, 1, 20)
    return { success: true, message: 'Cache refreshed successfully' }
  } catch (error) {
    console.error('[Server] Error refreshing cache:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to refresh cache' 
    }
  }
}

export async function getCacheStats() {
  try {
    const stats = await cacheService.getCacheStats()
    const needsRefresh = await cacheService.needsRefresh()
    
    return {
      success: true,
      data: {
        ...stats,
        needsRefresh,
        lastChecked: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('[Server] Error getting cache stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cache stats'
    }
  }
}
