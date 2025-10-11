"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { OssSearchParams } from "@/lib/fetchRepos"

type Props = {
  initialParams: OssSearchParams
  onParamsChange: (params: OssSearchParams) => void
}

const LANGS = [
  "all",
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C++",
  "C",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
]
const SORTS = [
  { value: "popular", label: "Popular (stars)" },
  { value: "new", label: "New (recently created)" },
  { value: "old", label: "Old (earliest)" },
  { value: "growing", label: "Growing (updated)" },
]
const DIFFS = ["all", "beginner", "intermediate", "advanced"]

export function Filters({ initialParams, onParamsChange }: Props) {
  const [q, setQ] = useState(initialParams.q || "")
  const [language, setLanguage] = useState(initialParams.language || "all")
  const [difficulty, setDifficulty] = useState(initialParams.difficulty || "all")
  const [sort, setSort] = useState(initialParams.sort || "popular")

  // Debounce search input
  const debouncedQ = useDebounce(q, 350)

  useEffect(() => {
    onParamsChange({
      q: debouncedQ,
      language,
      difficulty,
      sort,
      order: sort === "old" ? "asc" : "desc",
      perPage: initialParams.perPage,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, language, difficulty, sort])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="md:col-span-2">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <Input
          id="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search repositories or tags…"
          className="h-10"
        />
      </div>
      <div className="flex items-center gap-4 md:col-span-2">
        <div className="flex-1">
          <Label htmlFor="language" className="sr-only">
            Language
          </Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language" className="h-10">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l === "all" ? "All Languages" : l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="difficulty" className="sr-only">
            Difficulty
          </Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger id="difficulty" className="h-10">
              <SelectValue placeholder="All Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d === "all" ? "All Difficulty" : capitalize(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="sort" className="sr-only">
            Sort
          </Label>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger id="sort" className="h-10">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
