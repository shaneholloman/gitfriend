"use client"
import { RepoTable, type Repository } from "./repo-table"

export function DiscoverSection({ repositories, loading }: { repositories: Repository[]; loading: boolean }) {
  return <RepoTable repositories={repositories} loading={loading} />
}
