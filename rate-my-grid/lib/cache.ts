import { storeMode } from "./config";

/** Short-lived JSON cache (lookup results). In memory for local development; Redis in production (step 4). */
interface Cache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}

function memoryCache(): Cache {
  const g = globalThis as typeof globalThis & { __rmgCache?: Map<string, { value: string; expires: number }> };
  const map = (g.__rmgCache ??= new Map());
  return {
    async get(key) {
      const hit = map.get(key);
      if (!hit || hit.expires < Date.now()) return null;
      return JSON.parse(hit.value);
    },
    async set(key, value, ttlSeconds) {
      map.set(key, { value: JSON.stringify(value), expires: Date.now() + ttlSeconds * 1000 });
    },
  };
}

export function cache(): Cache {
  const mode = storeMode();
  if (mode === "mock") return memoryCache();
  throw new Error(mode === "off" ? "Cache is not configured (set the Upstash Redis variables)" : "Redis cache not added yet");
}
