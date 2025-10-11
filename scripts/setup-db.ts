#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as schema from '../lib/db/schema'

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  console.log('🚀 Setting up database...')

  try {
    // Create connection
    const connection = postgres(process.env.DATABASE_URL, { max: 1 })
    const db = drizzle(connection, { schema })

    // Run migrations
    console.log('📦 Running migrations...')
    await migrate(db, { migrationsFolder: './drizzle' })

    console.log('✅ Database setup completed successfully!')
    
    // Close connection
    await connection.end()
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

setupDatabase()
