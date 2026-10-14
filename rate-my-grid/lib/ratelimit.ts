/**
 * Caps on the endpoints that cost money: the AI analysis and the Instagram lookup.
 * Fixed windows: per visitor (short burst and per day) plus one global daily cap as a spending ceiling.
 */
export type LimitPolicy = {
  name: string;
  burst: { max: number; windowSeconds: number };
  daily: { max: number; windowSeconds: number };
  globalDaily: () => number;
};

export const ANALYSIS_LIMITS: LimitPolicy = {
  name: "analyze",
  burst: { max: 3, windowSeconds: 10 * 60 },
  daily: { max: 8, windowSeconds: 24 * 60 * 60 },
  globalDaily: () => Number(process.env.DAILY_ANALYSIS_CAP ?? 300),
};

/** Only lookups that reach Apify count; cached ones are free. */
export const LOOKUP_LIMITS: LimitPolicy = {
  name: "lookup",
  burst: { max: 5, windowSeconds: 10 * 60 },
  daily: { max: 15, windowSeconds: 24 * 60 * 60 },
  globalDaily: () => Number(process.env.DAILY_LOOKUP_CAP ?? 200),
};

export type LimitResult = { ok: true } | { ok: false; retryAfterSeconds: number; scope: "visitor" | "global" };

type Counter = (key: string, windowSeconds: number) => Promise<{ count: number; resetInSeconds: number }>;

function memoryCounter(): Counter {
  const g = globalThis as typeof globalThis & { __rmgCounters?: Map<string, { count: number; resetAt: number }> };
  const map = (g.__rmgCounters ??= new Map());
  return async (key, windowSeconds) => {
    const now = Date.now();
    let entry = map.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowSeconds * 1000 };
      map.set(key, entry);
    }
    entry.count += 1;
    return { count: entry.count, resetInSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  };
}

export async function checkRateLimit(visitor: string, policy: LimitPolicy, counter: Counter = memoryCounter()): Promise<LimitResult> {
  for (const [name, rule] of [
    ["burst", policy.burst],
    ["daily", policy.daily],
  ] as const) {
    const { count, resetInSeconds } = await counter(`rl:${policy.name}:${name}:${visitor}`, rule.windowSeconds);
    if (count > rule.max) return { ok: false, retryAfterSeconds: resetInSeconds, scope: "visitor" };
  }
  const day = new Date().toISOString().slice(0, 10);
  const { count, resetInSeconds } = await counter(`rl:${policy.name}:global:${day}`, 24 * 60 * 60);
  if (count > policy.globalDaily()) return { ok: false, retryAfterSeconds: resetInSeconds, scope: "global" };
  return { ok: true };
}

/** Vercel sets x-forwarded-for; the first entry is the visitor. */
export function visitorKey(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
