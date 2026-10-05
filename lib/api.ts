import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Returns an error response when the caller isn't a signed-in admin. */
export async function adminGuard() {
  return (await isAdmin()) ? null : bad("Not signed in", 401);
}

export function str(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s.slice(0, max);
}

export function cleanUrl(v: unknown): string | null | "invalid" {
  const s = str(v, 2000);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "invalid";
  } catch {
    return "invalid";
  }
}
