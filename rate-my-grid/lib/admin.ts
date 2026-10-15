import { createHash, timingSafeEqual } from "node:crypto";
import { demoAllowed } from "./config";

/**
 * Access to the hidden test page (/admin/test). Set ADMIN_TOKEN to a long random string and enter it on
 * the page. Without ADMIN_TOKEN the page only works in local development, never on the live site.
 */
export function adminEnabled() {
  return Boolean(process.env.ADMIN_TOKEN) || demoAllowed();
}

export function adminAuthorised(token: string | null) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return demoAllowed();
  if (!token) return false;
  // Compare hashes so the check takes the same time whatever was typed.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(token), digest(expected));
}
