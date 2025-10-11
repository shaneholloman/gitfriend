# Database Setup Guide

This project uses PostgreSQL with Drizzle ORM for caching GitHub repository data to avoid rate limiting issues.

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database running locally or in the cloud
2. **Environment Variables**: Set up your `.env.local` file with the required variables

## Environment Variables

Add these to your `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/gitfriend

# GitHub API (required for fetching data)
GITHUB_ACCESS_TOKEN=your_github_access_token

# Other existing variables...
```

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Database Migrations
```bash
npm run db:generate
```

### 3. Run Migrations
```bash
npm run db:migrate
```

### 4. Start the Development Server
```bash
npm run dev
```

## Database Schema

The system creates the following tables:

- **repositories**: Stores GitHub repository metadata
- **users**: Handles authenticated users
- **topics**: Repository topics/tags for categorization
- **repository_topics**: Many-to-many relationship between repos and topics
- **favorites**: User-saved repositories

## How It Works

1. **First Request**: When you search for repositories, the system checks if data is cached
2. **Cache Miss**: If no cached data exists or it's stale (>1 hour), it fetches from GitHub API
3. **Cache Store**: Fresh data is stored in PostgreSQL for future requests
4. **Cache Hit**: Subsequent requests serve data from the database (much faster)

## API Endpoints

- `GET /api/repos` - Get cached repositories with filters
- `POST /api/repos` - Force refresh data from GitHub
- `GET /api/repos/languages` - Get available programming languages
- `GET /api/repos/stats` - Get cache statistics

## Benefits

- ✅ **No Rate Limiting**: Avoids GitHub API rate limits
- ✅ **Faster Search**: Database queries are much faster than API calls
- ✅ **Offline Capability**: Works even when GitHub API is down
- ✅ **Smart Caching**: Only refreshes when data is stale
- ✅ **Rich Filtering**: Advanced search and filter capabilities

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your `DATABASE_URL` format
- Verify database credentials

### Migration Issues
- Make sure you have the latest migrations
- Check database permissions
- Verify the database exists

### GitHub API Issues
- Ensure `GITHUB_ACCESS_TOKEN` is set
- Check token permissions
- Verify token is not expired
