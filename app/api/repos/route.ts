import { NextRequest, NextResponse } from 'next/server'
import { GitHubCacheService } from '@/lib/services/github-cache'

const cacheService = new GitHubCacheService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      query: searchParams.get('q') || '',
      language: searchParams.get('language') || 'all',
      difficulty: searchParams.get('difficulty') || 'all',
      sort: searchParams.get('sort') || 'stars',
      order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      perPage: parseInt(searchParams.get('perPage') || '30'),
    }

    // Check if we need to refresh data
    const needsRefresh = await cacheService.needsRefresh()
    
    if (needsRefresh && filters.query) {
      // Fetch fresh data from GitHub
      console.log('[API] Refreshing data from GitHub')
      await cacheService.fetchAndCacheRepositories(filters.query, filters.page, filters.perPage)
    }

    // Get cached data
    const result = await cacheService.getCachedRepositories(filters)

    return NextResponse.json({
      success: true,
      data: result,
      cached: !needsRefresh,
    })
  } catch (error) {
    console.error('[API] Error fetching repositories:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch repositories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, page = 1, perPage = 30 } = await request.json()

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    console.log('[API] Force refreshing data from GitHub')
    const result = await cacheService.fetchAndCacheRepositories(query, page, perPage)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Data refreshed successfully',
    })
  } catch (error) {
    console.error('[API] Error refreshing repositories:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to refresh repositories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
