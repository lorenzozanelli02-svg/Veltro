import { compareEngagement, type BenchmarkComparison } from "../benchmarks";
import { findCta } from "../cta";
import type { PostType, Profile } from "./types";

/**
 * Hard numbers worked out from the profile on the server. The AI is given these as facts and never
 * does arithmetic itself; the rubric's measurable checks are scored from them directly.
 */
export type ProfileMetrics = {
  postsAnalysed: number;
  likesHidden: boolean;
  avgLikes: number | null;
  avgComments: number | null;
  /** Average (likes + comments) per recent post as a percentage of followers. */
  engagementRate: number | null;
  benchmark: BenchmarkComparison | null;
  postsLast30Days: number;
  /**
   * Posts per week over the last 30 days. When every fetched post is from the last 30 days (we only
   * see the latest 12), it's measured over the time those posts cover, so frequent posters aren't
   * undercounted.
   */
  postsPerWeek: number | null;
  daysSinceLastPost: number | null;
  /** Days between each pair of posts in a row, newest first. */
  gapsDays: number[];
  /** The longest of those gaps, or the time since the last post if that's longer. */
  longestGapDays: number | null;
  /** Average days between the analysed posts. */
  avgDaysBetweenPosts: number | null;
  formats: Record<PostType, number>;
  /** Share of posts by format, in whole percent: Reels (including other videos), carousels, single images. */
  formatShare: { reels: number; carousels: number; images: number };
  /** Average likes plus comments per format, to show which kind of post works best for them. */
  engagementByFormat: Partial<Record<PostType, number>>;
  /** Captions that ask the reader to do something (see lib/cta.ts), with the post numbers (1 = newest). */
  captionsWithCta: number;
  ctaPosts: { post: number; phrase: string }[];
  /** Pinned posts, by post number. */
  pinnedPosts: number[];
};

const DAY = 24 * 60 * 60 * 1000;
const round = (n: number, places = 1) => Math.round(n * 10 ** places) / 10 ** places;
const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

export function profileMetrics(profile: Profile, now = new Date()): ProfileMetrics {
  const posts = profile.posts;
  // Pinned posts can be months old with years of likes, so engagement and frequency use the rest.
  const recent = posts.filter((p) => !p.isPinned);
  const withLikes = recent.filter((p) => p.likes !== null);
  const avgLikes = average(withLikes.map((p) => p.likes!));
  const avgComments = average(recent.filter((p) => p.comments !== null).map((p) => p.comments!));

  const engagement = (p: (typeof posts)[number]) => (p.likes ?? 0) + (p.comments ?? 0);
  const followers = profile.followers;
  const engagementRate =
    followers && withLikes.length ? round((average(withLikes.map(engagement))! / followers) * 100, 2) : null;

  const dates = recent
    .map((p) => (p.postedAt ? new Date(p.postedAt).getTime() : NaN))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a);
  const ageDays = (t: number) => (now.getTime() - t) / DAY;
  const postsLast30Days = dates.filter((t) => ageDays(t) <= 30).length;
  const daysSinceLastPost = dates.length ? Math.max(0, Math.floor(ageDays(dates[0]))) : null;
  const gapsDays = dates.slice(1).map((t, i) => round((dates[i] - t) / DAY));
  const longestGapDays = dates.length ? Math.max(daysSinceLastPost ?? 0, ...gapsDays.map(Math.floor)) : null;
  const avgDaysBetweenPosts = dates.length > 1 ? round((dates[0] - dates[dates.length - 1]) / DAY / (dates.length - 1)) : null;

  let postsPerWeek: number | null = null;
  if (dates.length) {
    const oldest = ageDays(dates[dates.length - 1]);
    // All fetched posts are recent: there may be more we can't see, so use the span they cover.
    postsPerWeek = oldest <= 30 ? round((dates.length / Math.max(oldest, 1)) * 7) : round((postsLast30Days / 30) * 7);
  }

  const formats: Record<PostType, number> = { Reel: 0, Video: 0, Carousel: 0, Image: 0 };
  posts.forEach((p) => formats[p.type]++);
  const engagementByFormat: Partial<Record<PostType, number>> = {};
  for (const type of Object.keys(formats) as PostType[]) {
    const avg = average(withLikes.filter((p) => p.type === type).map(engagement));
    if (avg !== null) engagementByFormat[type] = Math.round(avg);
  }

  const ctaPosts = posts
    .map((p, i) => ({ post: i + 1, phrase: findCta(p.caption) }))
    .filter((c): c is { post: number; phrase: string } => c.phrase !== null);

  return {
    postsAnalysed: posts.length,
    likesHidden: recent.length > 0 && withLikes.length === 0,
    avgLikes: avgLikes === null ? null : Math.round(avgLikes),
    avgComments: avgComments === null ? null : Math.round(avgComments),
    engagementRate,
    benchmark: compareEngagement(followers, engagementRate),
    postsLast30Days,
    postsPerWeek,
    daysSinceLastPost,
    gapsDays,
    longestGapDays,
    avgDaysBetweenPosts,
    formats,
    formatShare: {
      reels: percent(formats.Reel + formats.Video, posts.length),
      carousels: percent(formats.Carousel, posts.length),
      images: percent(formats.Image, posts.length),
    },
    engagementByFormat,
    captionsWithCta: ctaPosts.length,
    ctaPosts,
    pinnedPosts: posts.flatMap((p, i) => (p.isPinned ? [i + 1] : [])),
  };
}
