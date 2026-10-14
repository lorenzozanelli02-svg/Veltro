import type { PostType, Profile, ProfilePost, ProviderResult } from "./types";

/**
 * Looks up a public profile with Apify's Instagram Profile Scraper. Server only: the token never
 * leaves this file. Starts a run, waits for it (Apify holds the request open for up to 60 s at a
 * time), then reads the single result from the run's dataset.
 */

const API = "https://api.apify.com/v2";
const TERMINAL = new Set(["SUCCEEDED", "FAILED", "TIMED-OUT", "ABORTED"]);

type Run = {
  id: string;
  status: string;
  defaultDatasetId: string;
  usageTotalUsd?: number;
  chargedEventCounts?: Record<string, number>;
};

type Json = Record<string, unknown>;

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const pick = (o: Json, ...keys: string[]) => keys.map((k) => o[k]).find((v) => v !== undefined && v !== null);

function postType(p: Json): PostType {
  const type = str(p.type).toLowerCase();
  if (type === "sidecar" || type === "carousel") return "Carousel";
  if (type === "video") return str(p.productType).toLowerCase() === "clips" ? "Reel" : "Video";
  return "Image";
}

function mapPost(p: Json, index: number): ProfilePost {
  const shortCode = str(p.shortCode);
  const images = Array.isArray(p.images) ? (p.images as unknown[]) : [];
  return {
    id: str(pick(p, "id", "shortCode")) || String(index),
    type: postType(p),
    caption: str(p.caption).slice(0, 2200),
    likes: num(p.likesCount),
    comments: num(p.commentsCount),
    views: num(pick(p, "videoViewCount", "videoPlayCount")),
    postedAt: str(p.timestamp) || null,
    imageUrl: str(pick(p, "displayUrl", "thumbnailUrl")) || str(images[0]) || null,
    url: str(p.url) || (shortCode ? `https://www.instagram.com/p/${shortCode}/` : null),
    isPinned: Boolean(p.isPinned),
  };
}

/** Maps one dataset item to our profile shape. Field names follow Apify's profile scraper output. */
export function mapApifyItem(item: Json): Profile {
  const links = Array.isArray(item.externalUrls) ? (item.externalUrls as Json[]) : [];
  const posts = (Array.isArray(item.latestPosts) ? (item.latestPosts as Json[]) : [])
    .map(mapPost)
    .sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""))
    .slice(0, 12);
  return {
    username: str(item.username).toLowerCase(),
    fullName: str(item.fullName),
    bio: str(item.biography),
    avatarUrl: str(pick(item, "profilePicUrlHD", "profilePicUrl")) || null,
    externalUrl: str(item.externalUrl) || str(links[0]?.url) || null,
    followers: num(item.followersCount),
    following: num(item.followsCount),
    postsCount: num(item.postsCount),
    category: str(pick(item, "businessCategoryName", "categoryName")) || null,
    isVerified: Boolean(item.verified),
    isBusiness: Boolean(item.isBusinessAccount),
    posts,
  };
}

type Classified = { status: "ok"; profile: Profile } | { status: "private" | "not_found" | "failed"; detail: string };

/** Decides what the dataset means: a profile, a private account, or no such account. */
export function classifyApifyItems(items: unknown, username: string): Classified {
  const item = Array.isArray(items) ? (items[0] as Json | undefined) : undefined;
  if (!item) return { status: "not_found", detail: "empty dataset" };
  const error = str(pick(item, "error", "errorDescription"));
  if (error) {
    if (/not.?found|does ?n[o']t exist|no such|404/i.test(error)) return { status: "not_found", detail: error };
    if (/private/i.test(error)) return { status: "private", detail: error };
    return { status: "failed", detail: error };
  }
  if (!str(item.username)) return { status: "not_found", detail: "no username in result" };
  if (item.private === true || item.isPrivate === true) return { status: "private", detail: "private account" };
  const profile = mapApifyItem(item);
  if (profile.username !== username) return { status: "not_found", detail: `returned @${profile.username}` };
  return { status: "ok", profile };
}

/**
 * What a run cost: Apify's platform usage for the run, plus the actor's per-result price if one is
 * set in APIFY_COST_PER_RESULT_USD (pay-per-result actors bill results separately from usage).
 */
function cost(run: Run | null, results = 0) {
  if (!run) return { costUsd: null, costDetail: {} };
  const usage = typeof run.usageTotalUsd === "number" ? run.usageTotalUsd : null;
  const perResult = Number(process.env.APIFY_COST_PER_RESULT_USD ?? 0) * results;
  const costUsd = usage === null && !perResult ? null : Math.round(((usage ?? 0) + perResult) * 1e6) / 1e6;
  return { costUsd, costDetail: { runId: run.id, usageTotalUsd: usage, results, chargedEventCounts: run.chargedEventCounts ?? null } };
}

export async function fetchFromApify(username: string, timeoutMs: number): Promise<ProviderResult> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return { status: "failed", detail: "APIFY_TOKEN is not set", costUsd: null };
  const actor = process.env.APIFY_ACTOR_ID ?? "apify~instagram-profile-scraper";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const deadline = Date.now() + timeoutMs;
  const secondsLeft = () => Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  let run: Run | null = null;

  try {
    const params = new URLSearchParams({
      waitForFinish: String(Math.min(60, secondsLeft())),
      // Caps on what one run can be charged: a single result, and a hard dollar ceiling.
      maxItems: "1",
      maxTotalChargeUsd: process.env.APIFY_MAX_CHARGE_PER_LOOKUP_USD ?? "0.05",
    });
    const started = await fetch(`${API}/acts/${actor}/runs?${params}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ usernames: [username] }),
      signal: AbortSignal.timeout(timeoutMs + 5000),
    });
    if (!started.ok) return { status: "failed", detail: `start run: HTTP ${started.status}`, costUsd: null };
    run = ((await started.json()) as { data: Run }).data;

    while (!TERMINAL.has(run.status) && secondsLeft() > 0) {
      const wait = Math.min(60, secondsLeft());
      const polled: Response = await fetch(`${API}/actor-runs/${run.id}?waitForFinish=${wait}`, {
        headers,
        signal: AbortSignal.timeout((wait + 5) * 1000),
      });
      if (!polled.ok) return { status: "failed", detail: `poll run: HTTP ${polled.status}`, ...cost(run) };
      run = ((await polled.json()) as { data: Run }).data;
    }

    if (!TERMINAL.has(run.status)) {
      // Stop paying for a run nobody is waiting for any more.
      fetch(`${API}/actor-runs/${run.id}/abort`, { method: "POST", headers }).catch(() => {});
      return { status: "timeout", detail: `still ${run.status} after ${timeoutMs} ms`, ...cost(run) };
    }
    if (run.status !== "SUCCEEDED") return { status: "failed", detail: `run ${run.status}`, ...cost(run) };

    const dataset = await fetch(`${API}/datasets/${run.defaultDatasetId}/items?clean=true&format=json`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (!dataset.ok) return { status: "failed", detail: `read dataset: HTTP ${dataset.status}`, ...cost(run) };
    const items: unknown = await dataset.json();
    const outcome = classifyApifyItems(items, username);
    return { ...outcome, ...cost(run, Array.isArray(items) ? items.length : 0) };
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return { status: timedOut ? "timeout" : "failed", detail: err instanceof Error ? err.message : String(err), ...cost(run) };
  }
}
