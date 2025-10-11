import { NextResponse } from 'next/server'
import { GitHubCacheService } from '@/lib/services/github-cache'

const cacheService = new GitHubCacheService()

export async function GET() {
  try {
    const languages = await cacheService.getAvailableLanguages()
    
    return NextResponse.json({
      success: true,
      data: languages,
    })
  } catch (error) {
    console.error('[API] Error fetching languages:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch languages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
