import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { repositories, users, topics, repositoryTopics, favorites } from '@/lib/db/schema'

export async function POST() {
  try {
    // Check if tables exist by trying to query them
    await db.select().from(repositories).limit(1)
    
    return NextResponse.json({
      success: true,
      message: 'Database is already initialized',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database not initialized. Please run migrations first.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
