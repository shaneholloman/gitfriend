"use client"

import { useCallback, useMemo, useRef } from "react"
import useSWRInfinite from "swr/infinite"
import { motion } from "framer-motion"
import { Filters } from "@/components/opens/Filters"
import { OssTable } from "@/components/opens/Table"
import { buildSearchParams, fetchRepos, decorateRepo, DEFAULT_PER_PAGE, type OssSearchParams } from "@/lib/fetchRepos"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function OpenSourceExplorerPage() {
  const paramsRef = useRef<OssSearchParams>({
    q: "",
    language: "all",
    difficulty: "all",
    sort: "popular",
    order: "desc",
    perPage: DEFAULT_PER_PAGE,
  })

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && previousPageData.end) return null
    const page = pageIndex + 1
    const key = buildSearchParams({ ...paramsRef.current, page })
    return key
  }

  const fetcher = async (key: string) => {
    const data = await fetchRepos(key)
    return data
  }

  const { data, error, isLoading, size, setSize, mutate, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: true,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: true,
  })

  const flat = useMemo(() => {
    const items = (data?.flatMap((d: any) => d.items) ?? []).map(decorateRepo)
    const end = data?.[data.length - 1]?.end ?? false
    return { items, end }
  }, [data])

  const onParamsChange = useCallback(
    async (next: OssSearchParams) => {
      paramsRef.current = next
      // reset pagination
      await mutate([], { revalidate: true })
    },
    [mutate],
  )

  const loadMore = useCallback(() => {
    if (!flat.end) setSize(size + 1)
  }, [flat.end, setSize, size])

  return (
    <main className={cn("min-h-[calc(100dvh-64px)] w-full bg-background text-foreground", "relative overflow-hidden")}>
      {/* Background gradient overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_20%_-10%,hsl(var(--muted))/35%,transparent_60%),radial-gradient(900px_500px_at_80%_-10%,hsl(var(--primary))/20%,transparent_55%)]"
      />
      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:py-10">
        <motion.h1
          className="text-balance text-3xl font-semibold tracking-tight md:text-4xl"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          Open Source Explorer
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-muted-foreground md:text-base"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          Discover and explore trending repositories with instant search, smart filters, and smooth pagination.
        </motion.p>

        <div className="mt-6">
          <Filters initialParams={paramsRef.current} onParamsChange={onParamsChange} />
        </div>

        <div className="mt-6">
          <OssTable
            items={flat.items}
            loading={isLoading || (isValidating && size === 1)}
            error={error ? "Failed to load repositories." : undefined}
            onEndReached={flat.end ? undefined : loadMore}
          />
          <div className="mt-4 flex items-center justify-center gap-3">
            {!flat.end && (
              <Button variant="secondary" onClick={loadMore} disabled={isValidating}>
                {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Load more
              </Button>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
