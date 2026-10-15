import type { LookupResult } from "./types";

/** The most recent posts we need, each with its picture and date, before we'll score from a lookup. */
export const REQUIRED_POSTS = 9;

/** `missing` is in plain words for the visitor; the post counts are for the logs. */
export type Completeness = { ok: true } | { ok: false; missing: string[]; postsUsable: number; postsNeeded: number };

/**
 * Checks a lookup returned everything the score depends on: the bio, follower and following counts,
 * and at least 9 recent posts with their pictures and dates (or every post, for accounts with fewer
 * than 9). Anything missing means a guessed score, so the visitor is asked for screenshots instead.
 */
export function checkCompleteness(result: LookupResult): Completeness {
  const { profile, images } = result;
  const missing: string[] = [];
  if (profile.bio === null) missing.push("your bio");
  if (profile.followers === null) missing.push("your follower count");
  if (profile.following === null) missing.push("your following count");

  const downloaded = new Set(images.map((img) => img.id));
  const usable = profile.posts.filter((p) => downloaded.has(p.id) && p.postedAt !== null && Number.isFinite(Date.parse(p.postedAt)));
  const needed = Math.min(REQUIRED_POSTS, profile.postsCount ?? REQUIRED_POSTS);
  if (usable.length < needed) missing.push("enough of your recent posts");

  return missing.length ? { ok: false, missing, postsUsable: usable.length, postsNeeded: needed } : { ok: true };
}

/** "a, b and c" */
export function listMissing(missing: string[]) {
  return missing.length > 1 ? `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}` : (missing[0] ?? "");
}
