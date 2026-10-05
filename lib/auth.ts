import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "veltro_admin";
const SESSION_DAYS = 14;

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(payload: string): string {
  return createHmac("sha256", process.env.ADMIN_PASSWORD ?? "").update(payload).digest("base64url");
}

/** Token = expiry.signature, signed with the admin password (changing it logs everyone out). */
export function createSessionToken(now = Date.now()): string {
  const expires = String(now + SESSION_DAYS * 24 * 60 * 60 * 1000);
  return `${expires}.${sign(expires)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token || !adminConfigured()) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < now) return false;
  const expected = Buffer.from(sign(expires));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function checkPassword(password: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = createHmac("sha256", "pw").update(password).digest();
  const b = createHmac("sha256", "pw").update(real).digest();
  return timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
