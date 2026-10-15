import { NextResponse } from "next/server";
import { parseInstagramHandle } from "@/lib/instagram-handle";
import { lookupProfile, toPreview } from "@/lib/lookup";
import { visitorKey } from "@/lib/ratelimit";

// A lookup waits for Apify (up to LOOKUP_TIMEOUT_MS) and then downloads the post images.
export const maxDuration = 120;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { handle?: unknown } | null;
  const handle = parseInstagramHandle(typeof body?.handle === "string" ? body.handle : "");
  if (!handle.ok) return NextResponse.json({ error: "invalid", message: handle.message }, { status: 400 });

  const outcome = await lookupProfile(handle.username, visitorKey(request.headers));
  if (outcome.status !== "ok") {
    // The browser switches to screenshot upload whenever a lookup can't be used.
    return NextResponse.json({ error: outcome.status, message: outcome.message, username: handle.username }, { status: 422 });
  }
  return NextResponse.json({ profile: toPreview(outcome.result) });
}
