/**
 * Typical Instagram engagement rates by follower count, so an account's own rate can be put in context.
 *
 * Engagement rate here means what we calculate in lib/lookup/metrics.ts: average (likes + comments) per
 * recent post, divided by followers, as a percentage.
 *
 * Edit these freely. Published figures disagree a lot (they use different samples and some divide by
 * reach instead of followers), so these are middle-of-the-road ranges drawn from 2025–26 reports by
 * Qoruz, Hypefy, CreatiCalc/SociaVault and HypeAuditor. Every source agrees on the shape: the more
 * followers, the lower the typical rate.
 */
export const ENGAGEMENT_BENCHMARKS = [
  { label: "under 1,000 followers", maxFollowers: 1_000, low: 3.5, high: 7 },
  { label: "1,000 to 10,000 followers", maxFollowers: 10_000, low: 2, high: 4.5 },
  { label: "10,000 to 50,000 followers", maxFollowers: 50_000, low: 1.5, high: 3 },
  { label: "50,000 to 100,000 followers", maxFollowers: 100_000, low: 1.2, high: 2.2 },
  { label: "100,000 to 500,000 followers", maxFollowers: 500_000, low: 0.9, high: 1.6 },
  { label: "over 500,000 followers", maxFollowers: Infinity, low: 0.5, high: 1.2 },
] as const;

export type BenchmarkComparison = {
  /** e.g. "1,000 to 10,000 followers" */
  range: string;
  low: number;
  high: number;
  rate: number;
  position: "below" | "within" | "above";
};

/** Where an engagement rate sits against accounts of the same size. Null when either number is unknown. */
export function compareEngagement(followers: number | null, rate: number | null): BenchmarkComparison | null {
  if (followers === null || rate === null) return null;
  const band = ENGAGEMENT_BENCHMARKS.find((b) => followers < b.maxFollowers) ?? ENGAGEMENT_BENCHMARKS[ENGAGEMENT_BENCHMARKS.length - 1];
  const position = rate < band.low ? "below" : rate > band.high ? "above" : "within";
  return { range: band.label, low: band.low, high: band.high, rate, position };
}

/** The comparison in one plain sentence, for the AI and the report. */
export function describeBenchmark(b: BenchmarkComparison) {
  const where = b.position === "within" ? "within" : b.position === "below" ? "below" : "above";
  return `${b.rate}% is ${where} the typical ${b.low}% to ${b.high}% for accounts with ${b.range}`;
}
