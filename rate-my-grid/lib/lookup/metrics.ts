import type { PostType, Profile } from "./types";

/** Hard numbers worked out from the profile, so the AI quotes facts instead of doing arithmetic. */
export type ProfileMetrics = {
  postsAnalysed: number;
  likesHidden: boolean;
  avgLikes: number | null;
  avgComments: number | null;
  /** Average (likes + comments) per post as a percentage of followers. */
  engagementRate: number | null;
  postsLast30Days: number;
  daysSinceLastPost: number | null;
  /** Average days between the analysed posts. */
  avgDaysBetweenPosts: number | null;
  formats: Record<PostType, number>;
  /** Average engagement per format, to show which kind of post works best for them. */
  engagementByFormat: Partial<Record<PostType, number>>;
};

const DAY = 24 * 60 * 60 * 1000;
const round = (n: number, places = 1) => Math.round(n * 10 ** places) / 10 ** places;
const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

export function profileMetrics(profile: Profile, now = new Date()): ProfileMetrics {
  const posts = profile.posts;
  const withLikes = posts.filter((p) => p.likes !== null);
  const avgLikes = average(withLikes.map((p) => p.likes!));
  const avgComments = average(posts.filter((p) => p.comments !== null).map((p) => p.comments!));

  const engagement = (p: (typeof posts)[number]) => (p.likes ?? 0) + (p.comments ?? 0);
  const followers = profile.followers;
  const engagementRate =
    followers && withLikes.length ? round((average(withLikes.map(engagement))! / followers) * 100, 2) : null;

  // Pinned posts can be old, so frequency is measured on the rest.
  const dates = posts
    .filter((p) => !p.isPinned && p.postedAt)
    .map((p) => new Date(p.postedAt!).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a);
  const postsLast30Days = dates.filter((t) => now.getTime() - t <= 30 * DAY).length;
  const daysSinceLastPost = dates.length ? Math.max(0, Math.floor((now.getTime() - dates[0]) / DAY)) : null;
  const avgDaysBetweenPosts = dates.length > 1 ? round((dates[0] - dates[dates.length - 1]) / DAY / (dates.length - 1)) : null;

  const formats: Record<PostType, number> = { Reel: 0, Video: 0, Carousel: 0, Image: 0 };
  posts.forEach((p) => formats[p.type]++);
  const engagementByFormat: Partial<Record<PostType, number>> = {};
  for (const type of Object.keys(formats) as PostType[]) {
    const avg = average(withLikes.filter((p) => p.type === type).map(engagement));
    if (avg !== null) engagementByFormat[type] = Math.round(avg);
  }

  return {
    postsAnalysed: posts.length,
    likesHidden: posts.length > 0 && withLikes.length === 0,
    avgLikes: avgLikes === null ? null : Math.round(avgLikes),
    avgComments: avgComments === null ? null : Math.round(avgComments),
    engagementRate,
    postsLast30Days,
    daysSinceLastPost,
    avgDaysBetweenPosts,
    formats,
    engagementByFormat,
  };
}
