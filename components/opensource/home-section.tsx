"use client"
import { RepoTable, type Repository } from "./repo-table"

export function HomeSection({ repositories, loading }: { repositories: Repository[]; loading: boolean }) {
  return <RepoTable repositories={repositories} loading={loading} />
}
