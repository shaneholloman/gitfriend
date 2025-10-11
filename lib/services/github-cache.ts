import { Octokit } from '@octokit/rest'
import { db, repositories, users, topics, repositoryTopics, favorites, type Repository, type User, type Topic } from '@/lib/db'
import { eq, and, desc, asc, ilike, sql, count, inArray } from 'drizzle-orm'

export class GitHubCacheService {
  private octokit: Octokit

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_ACCESS_TOKEN,
    })
  }

  // Fetch and cache repositories from GitHub
  async fetchAndCacheRepositories(query: string, page: number = 1, perPage: number = 30) {
    try {
      console.log(`[GitHubCache] Fetching repositories for query: ${query}, page: ${page}`)
      
      const response = await this.octokit.rest.search.repos({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: perPage,
        page,
      })

      const repos = response.data.items
      const cachedRepos: Repository[] = []

      for (const repo of repos) {
        try {
          // Check if repository already exists
          const existingRepo = await db
            .select()
            .from(repositories)
            .where(eq(repositories.githubId, repo.id))
            .limit(1)

          if (existingRepo.length > 0) {
            // Update existing repository
            const updatedRepo = await db
              .update(repositories)
              .set({
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                htmlUrl: repo.html_url,
                cloneUrl: repo.clone_url,
                language: repo.language,
                stargazersCount: repo.stargazers_count,
                forksCount: repo.forks_count,
                openIssuesCount: repo.open_issues_count,
                watchersCount: repo.watchers_count,
                size: repo.size,
                topics: repo.topics || [],
                isPrivate: repo.private,
                isFork: repo.fork,
                isArchived: repo.archived,
                isDisabled: repo.disabled,
                updatedAt: new Date(repo.updated_at),
                pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
                lastFetched: new Date(),
                difficulty: this.calculateDifficulty(repo),
              })
              .where(eq(repositories.githubId, repo.id))
              .returning()

            cachedRepos.push(updatedRepo[0])
          } else {
            // Insert new repository
            const newRepo = await db
              .insert(repositories)
              .values({
                githubId: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                htmlUrl: repo.html_url,
                cloneUrl: repo.clone_url,
                language: repo.language,
                stargazersCount: repo.stargazers_count,
                forksCount: repo.forks_count,
                openIssuesCount: repo.open_issues_count,
                watchersCount: repo.watchers_count,
                size: repo.size,
                topics: repo.topics || [],
                isPrivate: repo.private,
                isFork: repo.fork,
                isArchived: repo.archived,
                isDisabled: repo.disabled,
                createdAt: new Date(repo.created_at),
                updatedAt: new Date(repo.updated_at),
                pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
                difficulty: this.calculateDifficulty(repo),
              })
              .returning()

            cachedRepos.push(newRepo[0])
          }

          // Cache topics
          if (repo.topics && repo.topics.length > 0) {
            await this.cacheTopics(repo.topics, cachedRepos[cachedRepos.length - 1].id)
          }

        } catch (error) {
          console.error(`[GitHubCache] Error caching repository ${repo.full_name}:`, error)
        }
      }

      return {
        repositories: cachedRepos,
        totalCount: response.data.total_count,
        hasMore: repos.length === perPage,
      }
    } catch (error) {
      console.error('[GitHubCache] Error fetching repositories:', error)
      throw error
    }
  }

  // Cache topics for a repository
  private async cacheTopics(topicNames: string[], repositoryId: number) {
    for (const topicName of topicNames) {
      try {
        // Check if topic exists
        let topic = await db
          .select()
          .from(topics)
          .where(eq(topics.name, topicName))
          .limit(1)

        if (topic.length === 0) {
          // Create new topic
          const newTopic = await db
            .insert(topics)
            .values({
              name: topicName,
            })
            .returning()
          topic = newTopic
        }

        // Link topic to repository
        const existingLink = await db
          .select()
          .from(repositoryTopics)
          .where(
            and(
              eq(repositoryTopics.repositoryId, repositoryId),
              eq(repositoryTopics.topicId, topic[0].id)
            )
          )
          .limit(1)

        if (existingLink.length === 0) {
          await db.insert(repositoryTopics).values({
            repositoryId,
            topicId: topic[0].id,
          })
        }
      } catch (error) {
        console.error(`[GitHubCache] Error caching topic ${topicName}:`, error)
      }
    }
  }

  // Calculate difficulty based on repository metrics
  private calculateDifficulty(repo: any): 'beginner' | 'intermediate' | 'advanced' {
    const stars = repo.stargazers_count || 0
    const forks = repo.forks_count || 0
    const issues = repo.open_issues_count || 0
    const size = repo.size || 0

    // Simple heuristic for difficulty
    if (stars < 10 && forks < 5 && size < 1000) {
      return 'beginner'
    } else if (stars < 100 && forks < 20 && size < 10000) {
      return 'intermediate'
    } else {
      return 'advanced'
    }
  }

  // Get cached repositories with filters
  async getCachedRepositories(filters: {
    query?: string
    language?: string
    difficulty?: string
    sort?: string
    order?: 'asc' | 'desc'
    page?: number
    perPage?: number
  }) {
    const {
      query = '',
      language = 'all',
      difficulty = 'all',
      sort = 'stars',
      order = 'desc',
      page = 1,
      perPage = 30,
    } = filters

    let whereConditions = []

    // Search query
    if (query) {
      whereConditions.push(
        sql`(${repositories.name} ILIKE ${`%${query}%`} OR ${repositories.description} ILIKE ${`%${query}%`} OR ${repositories.fullName} ILIKE ${`%${query}%`})`
      )
    }

    // Language filter
    if (language !== 'all') {
      whereConditions.push(eq(repositories.language, language))
    }

    // Difficulty filter
    if (difficulty !== 'all') {
      whereConditions.push(eq(repositories.difficulty, difficulty))
    }

    // Only show public, non-archived, non-disabled repositories
    whereConditions.push(eq(repositories.isPrivate, false))
    whereConditions.push(eq(repositories.isArchived, false))
    whereConditions.push(eq(repositories.isDisabled, false))

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Build order by clause
    let orderBy
    switch (sort) {
      case 'stars':
        orderBy = order === 'desc' ? desc(repositories.stargazersCount) : asc(repositories.stargazersCount)
        break
      case 'forks':
        orderBy = order === 'desc' ? desc(repositories.forksCount) : asc(repositories.forksCount)
        break
      case 'updated':
        orderBy = order === 'desc' ? desc(repositories.updatedAt) : asc(repositories.updatedAt)
        break
      case 'created':
        orderBy = order === 'desc' ? desc(repositories.createdAt) : asc(repositories.createdAt)
        break
      default:
        orderBy = desc(repositories.stargazersCount)
    }

    const offset = (page - 1) * perPage

    const [repos, totalCount] = await Promise.all([
      db
        .select()
        .from(repositories)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: count() })
        .from(repositories)
        .where(whereClause)
    ])

    return {
      repositories: repos,
      totalCount: totalCount[0].count,
      hasMore: repos.length === perPage,
    }
  }

  // Get available languages from cached data
  async getAvailableLanguages() {
    const result = await db
      .selectDistinct({ language: repositories.language })
      .from(repositories)
      .where(
        and(
          eq(repositories.isPrivate, false),
          eq(repositories.isArchived, false),
          eq(repositories.isDisabled, false),
          sql`${repositories.language} IS NOT NULL`
        )
      )
      .orderBy(asc(repositories.language))

    return result.map(row => row.language).filter(Boolean)
  }

  // Get repository by ID
  async getRepositoryById(id: number) {
    const result = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, id))
      .limit(1)

    return result[0] || null
  }

  // Add repository to favorites
  async addToFavorites(userId: number, repositoryId: number) {
    try {
      await db.insert(favorites).values({
        userId,
        repositoryId,
      })
      return true
    } catch (error) {
      // Handle duplicate key error
      return false
    }
  }

  // Remove repository from favorites
  async removeFromFavorites(userId: number, repositoryId: number) {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.repositoryId, repositoryId)
        )
      )
  }

  // Get user's favorite repositories
  async getUserFavorites(userId: number, page: number = 1, perPage: number = 30) {
    const offset = (page - 1) * perPage

    const result = await db
      .select({
        repository: repositories,
        favoritedAt: favorites.createdAt,
      })
      .from(favorites)
      .innerJoin(repositories, eq(favorites.repositoryId, repositories.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))
      .limit(perPage)
      .offset(offset)

    return result.map(row => ({
      ...row.repository,
      favoritedAt: row.favoritedAt,
    }))
  }

  // Check if data needs refresh (older than 1 hour)
  async needsRefresh() {
    const result = await db
      .select({ lastFetched: repositories.lastFetched })
      .from(repositories)
      .orderBy(desc(repositories.lastFetched))
      .limit(1)

    if (result.length === 0) return true

    const lastFetched = result[0].lastFetched
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    return !lastFetched || lastFetched < oneHourAgo
  }

  // Get cache statistics
  async getCacheStats() {
    const [repoCount, userCount, topicCount, favoriteCount] = await Promise.all([
      db.select({ count: count() }).from(repositories),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(topics),
      db.select({ count: count() }).from(favorites),
    ])

    return {
      repositories: repoCount[0].count,
      users: userCount[0].count,
      topics: topicCount[0].count,
      favorites: favoriteCount[0].count,
    }
  }
}
