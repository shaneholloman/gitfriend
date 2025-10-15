"use client"
import { RepoTable, type Repository } from "./repo-table"

export function TrendingSection({
  repositories,
  loading,
}: {
  repositories: Repository[]
  loading: boolean
}) {
  return <RepoTable repositories={repositories} loading={loading} showRank />
}
