import sharp from "sharp";
import type { LookupImage } from "./types";

/**
 * Downloads images from Instagram's CDN as soon as a lookup finishes (the links expire), and shrinks
 * them to JPEGs small enough to cache and send to the AI.
 */

// Only Instagram and Facebook image hosts: a lookup result can never make the server fetch anything else.
const ALLOWED_HOSTS = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i;
const MAX_DOWNLOAD_BYTES = 15 * 1024 * 1024;

export function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_HOSTS.test(url.hostname);
  } catch {
    return false;
  }
}

/** Resizes to fit `maxSide` and re-encodes as JPEG. Throws if the bytes aren't an image. */
export async function toJpeg(input: Buffer, maxSide: number) {
  return sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}

async function download(url: string, timeoutMs: number) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const length = Number(res.headers.get("content-length") ?? 0);
  if (length > MAX_DOWNLOAD_BYTES) throw new Error("too large");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_DOWNLOAD_BYTES) throw new Error("too large");
  return buf;
}

export type ImageTarget = { id: string; url: string | null; maxSide: number };

/** Downloads what it can, a few at a time. Images that fail are skipped; the analysis still has the text data. */
export async function downloadImages(targets: ImageTarget[], { timeoutMs = 10_000, concurrency = 4 } = {}) {
  const images: LookupImage[] = [];
  const failed: string[] = [];
  const queue = targets.filter((t): t is ImageTarget & { url: string } => !!t.url && isAllowedImageUrl(t.url));
  failed.push(...targets.filter((t) => !t.url || !isAllowedImageUrl(t.url)).map((t) => t.id));

  async function worker() {
    for (let next = queue.shift(); next; next = queue.shift()) {
      try {
        const jpeg = await toJpeg(await download(next.url, timeoutMs), next.maxSide);
        images.push({ id: next.id, mediaType: "image/jpeg", data: jpeg.toString("base64") });
      } catch {
        failed.push(next.id);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  // Keep the original order: profile picture first, then posts newest first.
  const order = new Map(targets.map((t, i) => [t.id, i]));
  images.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return { images, failed };
}
