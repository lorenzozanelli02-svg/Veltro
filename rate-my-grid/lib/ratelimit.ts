/**
 * Caps on the analysis endpoint, which is the only thing that costs money per request.
 * Fixed windows: per visitor (short burst and per day) plus one global daily cap as a spending ceiling.
 */
export const LIMITS = {
  burst: { max: 3, windowSeconds: 10 * 60 },
  daily: { max: 8, windowSeconds: 24 * 60 * 60 },
  globalDaily: () => Number(process.env.DAILY_ANALYSIS_CAP ?? 300),
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

export async function checkRateLimit(visitor: string, counter: Counter = memoryCounter()): Promise<LimitResult> {
  for (const [name, rule] of [
    ["burst", LIMITS.burst],
    ["daily", LIMITS.daily],
  ] as const) {
    const { count, resetInSeconds } = await counter(`rl:${name}:${visitor}`, rule.windowSeconds);
    if (count > rule.max) return { ok: false, retryAfterSeconds: resetInSeconds, scope: "visitor" };
  }
  const day = new Date().toISOString().slice(0, 10);
  const { count, resetInSeconds } = await counter(`rl:global:${day}`, 24 * 60 * 60);
  if (count > LIMITS.globalDaily()) return { ok: false, retryAfterSeconds: resetInSeconds, scope: "global" };
  return { ok: true };
}

/** Vercel sets x-forwarded-for; the first entry is the visitor. */
export function visitorKey(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
