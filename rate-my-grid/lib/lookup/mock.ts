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

// Warm, believable colour pairs for the stand-in pictures.
const PALETTES = [
  ["#f3b391", "#c4626f"],
  ["#5d6b8a", "#2c3550"],
  ["#e8c9a0", "#a87f5e"],
  ["#9b7bb8", "#4f3a6e"],
  ["#8fc1ae", "#3f7564"],
  ["#f0a07a", "#8a4a5d"],
];

/** A head-and-shoulders silhouette on a gradient: a stand-in profile picture that needs no fonts. */
function avatarSvg(size: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f6c39b"/><stop offset="1" stop-color="#c4626f"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g)"/>
    <circle cx="50" cy="40" r="17" fill="#fff" fill-opacity="0.85"/>
    <path d="M18 100c2-20 16-30 32-30s30 10 32 30z" fill="#fff" fill-opacity="0.85"/>
  </svg>`;
}

/** A 4:5 post tile: a gradient with a few soft shapes, and a play button on Reels. */
function postSvg(width: number, index: number, type: ProfilePost["type"] | undefined) {
  const height = Math.round(width * 1.25);
  const [from, to] = PALETTES[index % PALETTES.length];
  const play =
    type === "Reel" || type === "Video"
      ? `<circle cx="50" cy="62" r="11" fill="#000" fill-opacity="0.25"/><path d="M46 56l10 6-10 6z" fill="#fff"/>`
      : "";
  const card = type === "Carousel" ? `<rect x="14" y="20" width="72" height="44" rx="6" fill="#fff" fill-opacity="0.18"/><rect x="22" y="72" width="40" height="5" rx="2.5" fill="#fff" fill-opacity="0.5"/><rect x="22" y="82" width="28" height="5" rx="2.5" fill="#fff" fill-opacity="0.35"/>` : "";
  const shapes = `<circle cx="${20 + ((index * 17) % 60)}" cy="${30 + ((index * 23) % 50)}" r="${18 + (index % 3) * 6}" fill="#fff" fill-opacity="0.12"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 100 125" preserveAspectRatio="none">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
    <rect width="100" height="125" fill="url(#g)"/>${shapes}${card}${play}
  </svg>`;
}

/** Drawn stand-ins for the profile picture and post images; they're real JPEGs, so the rest of the pipeline is exercised. */
export async function mockImage(id: string, maxSide: number) {
  const isAvatar = id === "avatar";
  const size = Math.min(maxSide, isAvatar ? 320 : 540);
  // Post ids are "mock-post-1" to "mock-post-12"; draw each with its own post's type (a play button on Reels).
  const index = Math.max(Number(id.match(/(\d+)$/)?.[1] ?? 1) - 1, 0);
  const svg = isAvatar ? avatarSvg(size) : postSvg(size, index, TYPES[index % TYPES.length]);
  const jpeg = await sharp(Buffer.from(svg)).flatten({ background: "#000" }).jpeg({ quality: 75 }).toBuffer();
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
