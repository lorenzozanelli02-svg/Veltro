import { describeBenchmark } from "./benchmarks";
import type { ProfileMetrics } from "./lookup/metrics";
import type { Profile } from "./lookup/types";

/**
 * The account's facts as short labelled lines, worked out on the server. They're given to the AI by id,
 * the AI cites them by id as evidence, and the report shows them the same way.
 */
export const FACT_IDS = [
  "followers",
  "following",
  "engagement_rate",
  "engagement_benchmark",
  "avg_likes",
  "avg_comments",
  "posts_per_week",
  "posts_last_30_days",
  "longest_gap",
  "days_since_last_post",
  "format_mix",
  "best_format",
  "captions_with_cta",
  "link_in_bio",
  "highlights",
  "pinned_posts",
] as const;

export type FactId = (typeof FACT_IDS)[number];

/** `value` is short enough for a tile ("1.8%"); `note` explains it where that helps. */
export type Fact = { id: FactId; label: string; value: string; note?: string };

const n = (value: number) => value.toLocaleString("en-GB");
const plural = (count: number, word: string) => `${n(count)} ${word}${count === 1 ? "" : "s"}`;

/** Every fact we know for this account. Unknown ones are left out rather than guessed. */
export function accountFacts(profile: Profile, m: ProfileMetrics): Fact[] {
  const facts: Fact[] = [];
  const add = (id: FactId, label: string, value: string | null, note?: string) => {
    if (value !== null) facts.push(note ? { id, label, value, note } : { id, label, value });
  };

  add("followers", "Followers", profile.followers === null ? null : n(profile.followers));
  add("following", "Following", profile.following === null ? null : n(profile.following));
  add(
    "engagement_rate",
    "Engagement rate",
    m.engagementRate === null ? (m.likesHidden ? "Unknown" : null) : `${m.engagementRate}%`,
    m.engagementRate === null ? "Like counts are hidden" : "Average likes plus comments per post, divided by followers",
  );
  add("engagement_benchmark", "Compared with similar accounts", m.benchmark ? describeBenchmark(m.benchmark) : null);
  add("avg_likes", "Average likes per post", m.avgLikes === null ? null : n(m.avgLikes));
  add("avg_comments", "Average comments per post", m.avgComments === null ? null : n(m.avgComments));
  add("posts_per_week", "Posts per week", m.postsPerWeek === null ? null : String(m.postsPerWeek));
  add("posts_last_30_days", "Posts in the last 30 days", n(m.postsLast30Days));
  add(
    "longest_gap",
    "Longest gap between posts",
    m.longestGapDays === null ? null : plural(m.longestGapDays, "day"),
    m.longestGapDays !== null && m.longestGapDays === m.daysSinceLastPost ? "Counting the time since your last post" : undefined,
  );
  add("days_since_last_post", "Days since the last post", m.daysSinceLastPost === null ? null : n(m.daysSinceLastPost));
  add(
    "format_mix",
    "Format mix",
    m.postsAnalysed ? `${m.formatShare.reels}% Reels` : null,
    `${m.formatShare.reels}% Reels and videos, ${m.formatShare.carousels}% carousels, ${m.formatShare.images}% single images`,
  );
  const best = (Object.entries(m.engagementByFormat) as [string, number][]).sort((a, b) => b[1] - a[1])[0];
  add(
    "best_format",
    "Best-performing format",
    best && Object.keys(m.engagementByFormat).length > 1 ? best[0] : null,
    best ? `${n(best[1])} likes plus comments on average` : undefined,
  );
  add(
    "captions_with_cta",
    "Captions with a call to action",
    m.postsAnalysed ? `${m.captionsWithCta} of ${m.postsAnalysed}` : null,
    m.ctaPosts.length ? m.ctaPosts.map((c) => `post ${c.post}: "${c.phrase}"`).join(", ") : "None of your recent captions asks people to do something",
  );
  add("link_in_bio", "Link in bio", profile.externalUrl ?? "none");
  add("highlights", "Story highlights", profile.highlights === null ? null : n(profile.highlights));
  add("pinned_posts", "Pinned posts", m.pinnedPosts.length ? m.pinnedPosts.map((p) => `post ${p}`).join(", ") : "none");
  return facts;
}
