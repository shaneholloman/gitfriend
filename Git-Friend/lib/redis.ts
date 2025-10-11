import { Redis } from "@upstash/redis"

// Minimal in-memory fallback with TTL support for local/dev when Upstash is not configured
class InMemoryRedisFallback {
  private store = new Map<string, { value: unknown; expiresAt?: number }>()

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return (entry.value as T) ?? null
  }

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<"OK"> {
    const expiresAt = typeof opts?.ex === "number" ? Date.now() + opts.ex * 1000 : undefined
    this.store.set(key, { value, expiresAt })
    return "OK"
  }
}

// Initialize Redis client, with automatic fallback to in-memory if unreachable
const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

type RedisLike = Pick<Redis, "get" | "set">

function isTransientNetworkError(error: unknown): boolean {
  const anyErr = error as any
  const code = anyErr?.code || anyErr?.cause?.code
  const name = anyErr?.name
  // ENOTFOUND/DNS, ECONNREFUSED, ETIMEDOUT are treated as transient connectivity issues
  return (
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    name === "TypeError" // fetch failed often surfaces as TypeError in undici
  )
}

class HybridRedis implements RedisLike {
  private primary: Redis | null
  private fallback: InMemoryRedisFallback
  private usingFallback: boolean

  constructor() {
    this.primary = hasUpstash
      ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
      : null
    this.fallback = new InMemoryRedisFallback()
    this.usingFallback = !this.primary

    if (!this.primary) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[Git-Friend] Upstash env not set. Using in-memory cache (dev only)."
        )
      } else {
        console.error(
          "[Git-Friend] Upstash env missing in production. Using in-memory cache (NOT recommended)."
        )
      }
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (this.primary && !this.usingFallback) {
      try {
        return (await this.primary.get<T>(key)) ?? null
      } catch (err) {
        if (process.env.NODE_ENV !== "production" || isTransientNetworkError(err)) {
          this.usingFallback = true
          console.warn(
            "[Git-Friend] Upstash unreachable. Falling back to in-memory cache for this session.",
            (err as Error)?.message || err
          )
          return await this.fallback.get<T>(key)
        }
        throw err
      }
    }
    return await this.fallback.get<T>(key)
  }

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<"OK"> {
    if (this.primary && !this.usingFallback) {
      try {
        return await this.primary.set(key, value as any, opts as any)
      } catch (err) {
        if (process.env.NODE_ENV !== "production" || isTransientNetworkError(err)) {
          this.usingFallback = true
          console.warn(
            "[Git-Friend] Upstash unreachable. Switching to in-memory cache for writes.",
            (err as Error)?.message || err
          )
          return await this.fallback.set(key, value, opts)
        }
        throw err
      }
    }
    return await this.fallback.set(key, value, opts)
  }
}

export const redis: RedisLike = new HybridRedis()

// README generation status types
export type ReadmeGenerationStatus = "pending" | "processing" | "completed" | "failed"

// Cache keys
export const CACHE_KEYS = {
  README_GENERATION: (repoUrl: string) => `readme:${repoUrl}`,
  README_STATUS: (repoUrl: string) => `readme:status:${repoUrl}`,
}

// Cache TTLs in seconds
export const CACHE_TTL = {
  README: 7 * 24 * 60 * 60, // 7 days
  STATUS: 24 * 60 * 60, // 1 day
}
