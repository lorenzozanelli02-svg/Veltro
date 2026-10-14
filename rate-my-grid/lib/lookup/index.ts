import { cache } from "../cache";
import { lookupMode, RETENTION } from "../config";
import { checkRateLimit, LOOKUP_LIMITS } from "../ratelimit";
import { fetchFromApify } from "./apify";
import { downloadImages } from "./images";
import { fetchFromMock, mockImage } from "./mock";
import type { LookupFailure, LookupImage, LookupOutcome, LookupResult, Profile, ProfilePreview, ProviderResult } from "./types";

/**
 * Public profile lookup: cache first (24 hours), then Apify. Only lookups that reach Apify are rate
 * limited and cost money, and every one of them is logged with its cost.
 */

const TIMEOUT_MS = () => Number(process.env.LOOKUP_TIMEOUT_MS ?? 60_000);
const KEY = (username: string) => `lookup:v1:${username}`;
const IMAGE_KEY = (username: string, i: number) => `lookup:v1:${username}:img:${i}`;

type CachedLookup =
  | { status: "ok"; profile: Profile; fetchedAt: string; provider: LookupResult["provider"]; imageCount: number }
  | { status: "private" | "not_found"; fetchedAt: string };

export function lookupMessage(status: LookupFailure, username: string) {
  const at = `@${username}`;
  switch (status) {
    case "private":
      return `${at} is a private account, so we can't see it from here. No problem: add a few screenshots instead and you'll still get your score.`;
    case "not_found":
      return `We couldn't find ${at} on Instagram. Check the spelling, or add a few screenshots instead.`;
    case "timeout":
      return `Instagram is slow to respond right now. Add a few screenshots instead and you'll still get your score.`;
    case "rate_limited":
      return `You've looked up a few accounts in a row. Add screenshots instead, or try another lookup in a few minutes.`;
    default:
      return `We couldn't look up ${at} just now. Add a few screenshots instead and you'll still get your score.`;
  }
}

/** One JSON line per lookup, so the cost of every Apify run shows up in the server logs. */
function logLookup(entry: Record<string, unknown>) {
  console.info(JSON.stringify({ event: "instagram_lookup", at: new Date().toISOString(), ...entry }));
}

async function readCache(username: string): Promise<LookupOutcome | null> {
  const store = cache();
  const hit = await store.get<CachedLookup>(KEY(username));
  if (!hit) return null;
  if (hit.status !== "ok") return { status: hit.status, message: lookupMessage(hit.status, username) };
  const images = (
    await Promise.all(Array.from({ length: hit.imageCount }, (_, i) => store.get<LookupImage>(IMAGE_KEY(username, i))))
  ).filter((img): img is LookupImage => img !== null);
  return { status: "ok", cached: true, result: { profile: hit.profile, images, fetchedAt: hit.fetchedAt, provider: hit.provider } };
}

async function fetchImages(profile: Profile, provider: LookupResult["provider"]) {
  const targets = [
    { id: "avatar", url: profile.avatarUrl, maxSide: 320 },
    ...profile.posts.map((p) => ({ id: p.id, url: p.imageUrl, maxSide: 1080 })),
  ];
  if (provider === "mock") return { images: await Promise.all(targets.map((t) => mockImage(t.id, t.maxSide))), failed: [] };
  return downloadImages(targets);
}

export async function lookupProfile(username: string, visitor: string): Promise<LookupOutcome> {
  const mode = lookupMode();
  const fail = (status: LookupFailure): LookupOutcome => ({ status, message: lookupMessage(status, username) });
  if (mode === "off") return fail("unavailable");

  try {
    const cached = await readCache(username);
    if (cached) {
      logLookup({ username, cached: true, status: cached.status, costUsd: 0 });
      return cached;
    }
  } catch (err) {
    console.error("lookup cache read failed", err);
    return fail("unavailable");
  }

  const limit = await checkRateLimit(visitor, LOOKUP_LIMITS);
  if (!limit.ok) {
    logLookup({ username, cached: false, status: "rate_limited", scope: limit.scope, costUsd: 0 });
    return fail("rate_limited");
  }

  const provider: LookupResult["provider"] = mode === "mock" ? "mock" : "apify";
  const started = Date.now();
  const fetched: ProviderResult =
    provider === "mock" ? await fetchFromMock(username, TIMEOUT_MS()) : await fetchFromApify(username, TIMEOUT_MS());
  const entry = { username, cached: false, provider, status: fetched.status, ms: Date.now() - started, costUsd: fetched.costUsd, ...fetched.costDetail };

  if (fetched.status !== "ok") {
    logLookup({ ...entry, detail: fetched.detail });
    if (fetched.status === "private" || fetched.status === "not_found") {
      await cache().set(KEY(username), { status: fetched.status, fetchedAt: new Date().toISOString() }, RETENTION.failedLookupSeconds);
    }
    return fail(fetched.status);
  }

  // Download the images now: Instagram's links stop working after a while.
  const { images, failed } = await fetchImages(fetched.profile, provider);
  logLookup({ ...entry, posts: fetched.profile.posts.length, images: images.length, imagesFailed: failed.length, totalMs: Date.now() - started });

  const result: LookupResult = { profile: fetched.profile, images, fetchedAt: new Date().toISOString(), provider };
  const store = cache();
  await Promise.all(images.map((img, i) => store.set(IMAGE_KEY(username, i), img, RETENTION.lookupSeconds)));
  await store.set(
    KEY(username),
    { status: "ok", profile: result.profile, fetchedAt: result.fetchedAt, provider, imageCount: images.length } satisfies CachedLookup,
    RETENTION.lookupSeconds,
  );
  return { status: "ok", result, cached: false };
}

export function toPreview(result: LookupResult): ProfilePreview {
  const { profile } = result;
  const avatar = result.images.find((img) => img.id === "avatar");
  return {
    username: profile.username,
    fullName: profile.fullName,
    bio: profile.bio,
    avatar: avatar ? `data:${avatar.mediaType};base64,${avatar.data}` : null,
    followers: profile.followers,
    following: profile.following,
    postsCount: profile.postsCount,
    postsFound: profile.posts.length,
    category: profile.category,
    isVerified: profile.isVerified,
  };
}
