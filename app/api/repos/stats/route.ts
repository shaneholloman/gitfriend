import { NextResponse } from 'next/server'
import { GitHubCacheService } from '@/lib/services/github-cache'

const cacheService = new GitHubCacheService()

export async function GET() {
  try {
    const stats = await cacheService.getCacheStats()
    const needsRefresh = await cacheService.needsRefresh()
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        needsRefresh,
        lastChecked: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[API] Error fetching cache stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cache stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
