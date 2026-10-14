import sharp from "sharp";
import type { Profile, ProfilePost, ProviderResult } from "./types";

/**
 * Stand-in for Apify while building. Any username "exists" and gets a believable coaching account.
 * A few usernames trigger each failure so the fallback to screenshots can be tested:
 *   private.account, no.such.account, slow.account, broken.account
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DAY = 24 * 60 * 60 * 1000;

const CAPTIONS = [
  "3 mistakes I see every week from mums trying to train at home 👇 Save this for your next session.",
  "Client win! Sarah dropped 2 dress sizes in 10 weeks without giving up wine on Fridays 🍷",
  "Monday motivation 💪 #fitness #fitfam #gym #motivation #mumlife",
  "20 minute full body workout you can do while the kids nap. No equipment.",
  "What I eat in a day as a busy mum of two (it's not chicken and rice).",
  "Quote of the day: 'Progress, not perfection.'",
  "Behind the scenes of a client check-in call.",
  "Stop doing endless cardio. Here's what to do instead.",
  "New programme dropping soon 👀",
  "Sunday reset routine.",
  "How I fit training into a 7am school run.",
  "Throwback to my first ever race 🏃‍♀️",
];

const TYPES: ProfilePost["type"][] = ["Reel", "Carousel", "Image", "Reel", "Carousel", "Image", "Reel", "Reel", "Image", "Image", "Carousel", "Image"];
const COLOURS = ["#c97a5d", "#5d6b8a", "#a87f5e", "#7d5d8a", "#5e8a7a", "#8a5d5d"];

export function mockProfile(username: string, now = new Date()): Profile {
  // Dates spread out like a real account: a few recent posts, then a gap.
  const offsets = [2, 6, 9, 21, 25, 30, 34, 41, 48, 55, 61, 70];
  const likes = [212, 340, 41, 198, 287, 36, 150, 402, 55, 48, 260, 30];
  return {
    username,
    fullName: "Sam Carter",
    bio: "Coach 💪 | Mum of 2 | 🏋️‍♀️\nLiving my best life ✨",
    avatarUrl: "mock://avatar",
    externalUrl: "https://linktr.ee/samcoach",
    followers: 3912,
    following: 480,
    postsCount: 214,
    category: "Personal trainer",
    isVerified: false,
    isBusiness: true,
    posts: offsets.map((days, i) => ({
      id: `mock-post-${i + 1}`,
      type: TYPES[i],
      caption: CAPTIONS[i],
      likes: likes[i],
      comments: Math.round(likes[i] / 14),
      views: TYPES[i] === "Reel" ? likes[i] * 9 : null,
      postedAt: new Date(now.getTime() - days * DAY).toISOString(),
      imageUrl: `mock://post/${i}`,
      url: `https://www.instagram.com/p/mock${i + 1}/`,
      isPinned: false,
    })),
  };
}

/** Plain coloured squares stand in for post images; they're real JPEGs, so the rest of the pipeline is exercised. */
export async function mockImage(id: string, maxSide: number) {
  const colour = COLOURS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COLOURS.length];
  const size = Math.min(maxSide, id === "avatar" ? 320 : 540);
  const jpeg = await sharp({ create: { width: size, height: id === "avatar" ? size : Math.round(size * 1.25), channels: 3, background: colour } })
    .jpeg({ quality: 70 })
    .toBuffer();
  return { id, mediaType: "image/jpeg" as const, data: jpeg.toString("base64") };
}

export async function fetchFromMock(username: string, timeoutMs: number): Promise<ProviderResult> {
  const delay = Number(process.env.MOCK_LOOKUP_DELAY_MS ?? 2500);
  if (username === "slow.account") {
    await sleep(Math.min(timeoutMs, 8000));
    return { status: "timeout", detail: "mock timeout", costUsd: 0.001 };
  }
  await sleep(delay);
  if (username === "private.account") return { status: "private", detail: "mock private", costUsd: 0.001 };
  if (username === "no.such.account") return { status: "not_found", detail: "mock not found", costUsd: 0.001 };
  if (username === "broken.account") return { status: "failed", detail: "mock failure", costUsd: null };
  return { status: "ok", profile: mockProfile(username), costUsd: 0.003, costDetail: { provider: "mock" } };
}
