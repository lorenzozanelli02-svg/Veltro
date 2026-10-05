import { NextResponse } from "next/server";
import { bad, readJson } from "@/lib/api";
import { ADMIN_COOKIE, SESSION_MAX_AGE, adminConfigured, checkPassword, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  if (!adminConfigured()) return bad("Set ADMIN_PASSWORD on the server to enable the admin area.", 503);
  const b = await readJson(req);
  if (!b || typeof b.password !== "string" || !checkPassword(b.password)) {
    await new Promise((r) => setTimeout(r, 400));
    return bad("Wrong password.", 401);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
