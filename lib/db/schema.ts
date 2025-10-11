import { pgTable, serial, text, integer, timestamp, boolean, jsonb, varchar, index } from 'drizzle-orm/pg-core'

export const repositories = pgTable('repositories', {
  id: serial('id').primaryKey(),
  githubId: integer('github_id').notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  description: text('description'),
  htmlUrl: text('html_url').notNull(),
  cloneUrl: text('clone_url').notNull(),
  language: varchar('language', { length: 100 }),
  stargazersCount: integer('stargazers_count').default(0),
  forksCount: integer('forks_count').default(0),
  openIssuesCount: integer('open_issues_count').default(0),
  watchersCount: integer('watchers_count').default(0),
  size: integer('size').default(0),
  topics: jsonb('topics').$type<string[]>().default([]),
  isPrivate: boolean('is_private').default(false),
  isFork: boolean('is_fork').default(false),
  isArchived: boolean('is_archived').default(false),
  isDisabled: boolean('is_disabled').default(false),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  pushedAt: timestamp('pushed_at'),
  lastFetched: timestamp('last_fetched').defaultNow(),
  difficulty: varchar('difficulty', { length: 20 }).default('intermediate'), // beginner, intermediate, advanced
}, (table) => ({
  nameIdx: index('repositories_name_idx').on(table.name),
  languageIdx: index('repositories_language_idx').on(table.language),
  starsIdx: index('repositories_stars_idx').on(table.stargazersCount),
  difficultyIdx: index('repositories_difficulty_idx').on(table.difficulty),
  lastFetchedIdx: index('repositories_last_fetched_idx').on(table.lastFetched),
}))

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  githubId: integer('github_id').unique(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  avatarUrl: text('avatar_url'),
  htmlUrl: text('html_url'),
  name: varchar('name', { length: 255 }),
  bio: text('bio'),
  location: varchar('location', { length: 255 }),
  company: varchar('company', { length: 255 }),
  blog: text('blog'),
  twitterUsername: varchar('twitter_username', { length: 255 }),
  publicRepos: integer('public_repos').default(0),
  publicGists: integer('public_gists').default(0),
  followers: integer('followers').default(0),
  following: integer('following').default(0),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  lastFetched: timestamp('last_fetched').defaultNow(),
}, (table) => ({
  usernameIdx: index('users_username_idx').on(table.username),
  githubIdIdx: index('users_github_id_idx').on(table.githubId),
}))

export const topics = pgTable('topics', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  nameIdx: index('topics_name_idx').on(table.name),
}))

export const repositoryTopics = pgTable('repository_topics', {
  id: serial('id').primaryKey(),
  repositoryId: integer('repository_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
  topicId: integer('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
}, (table) => ({
  repoTopicIdx: index('repo_topic_idx').on(table.repositoryId, table.topicId),
  topicRepoIdx: index('topic_repo_idx').on(table.topicId, table.repositoryId),
}))

export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  repositoryId: integer('repository_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userRepoIdx: index('favorites_user_repo_idx').on(table.userId, table.repositoryId),
  repoUserIdx: index('favorites_repo_user_idx').on(table.repositoryId, table.userId),
}))

export type Repository = typeof repositories.$inferSelect
export type NewRepository = typeof repositories.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Topic = typeof topics.$inferSelect
export type NewTopic = typeof topics.$inferInsert
export type Favorite = typeof favorites.$inferSelect
export type NewFavorite = typeof favorites.$inferInsert
