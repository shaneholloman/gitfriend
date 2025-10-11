import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create the connection
const connection = postgres(process.env.DATABASE_URL, {
  max: 1, // Use connection pooling in production
})

// Create the database instance
export const db = drizzle(connection, { schema })

// Export schema for use in other files
export * from './schema'
