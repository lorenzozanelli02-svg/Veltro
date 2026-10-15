/**
 * Which services are live. Without keys the app runs on mocks so the whole flow works locally.
 * Mocks are never used in production unless DEMO_MODE=true, so a missing key can't make the report free.
 */
export function demoAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";
}

export type Mode = "live" | "mock" | "off";

function mode(key: string | undefined, forceMock: string | undefined): Mode {
  if (forceMock === "true" && demoAllowed()) return "mock";
  if (key) return "live";
  return demoAllowed() ? "mock" : "off";
}

export function aiMode(): Mode {
  return mode(process.env.ANTHROPIC_API_KEY, process.env.MOCK_AI);
}

export function paymentsMode(): Mode {
  return mode(process.env.STRIPE_SECRET_KEY, process.env.MOCK_PAYMENTS);
}

export function lookupMode(): Mode {
  return mode(process.env.APIFY_TOKEN, process.env.MOCK_LOOKUP);
}

export function redisConfig() {
  // Vercel's Upstash integration sets the KV_* names; a direct Upstash database uses the UPSTASH_* ones.
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

export function storeMode(): Mode {
  if (redisConfig()) return "live";
  return demoAllowed() ? "mock" : "off";
}

/** How long things are kept. Uploaded screenshots are never stored at all. */
export const RETENTION = {
  unpaidSeconds: 60 * 60 * 24 * 30,
  paidSeconds: 60 * 60 * 24 * 365,
  // Instagram lookups (profile data and post images), so repeat lookups don't cost money.
  lookupSeconds: 60 * 60 * 24,
  // Private or missing accounts, so retyping the same name doesn't trigger another paid lookup.
  failedLookupSeconds: 60 * 60 * 6,
};

/** The Claude model that scores accounts. */
export function analysisModel() {
  return process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
}

/**
 * How hard the model thinks. Fixed (not left to the model's default) so every account gets the same
 * depth of review. "high" suits judgement-heavy work; "medium" is cheaper.
 */
export function analysisEffort(): "low" | "medium" | "high" | "xhigh" | "max" {
  const effort = process.env.ANALYSIS_EFFORT;
  return effort === "low" || effort === "medium" || effort === "xhigh" || effort === "max" ? effort : "high";
}

// Only these models accept a temperature setting. Newer ones (Claude Opus 4.7 onwards, including the
// default Claude Opus 5.5) reject it with an error, so it's sent only when one of these is configured.
const SAMPLING_MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-1"];

/** A low temperature for steadier scores, on models that allow it; nothing otherwise. */
export function analysisSampling(model: string): { temperature?: number } {
  if (!SAMPLING_MODELS.some((m) => model.startsWith(m))) return {};
  const temperature = Number(process.env.ANALYSIS_TEMPERATURE ?? 0);
  return { temperature: Number.isFinite(temperature) ? Math.min(Math.max(temperature, 0), 1) : 0 };
}
