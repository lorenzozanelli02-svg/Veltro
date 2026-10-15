import { randomBytes } from "node:crypto";

/** 128 random bits, URL-safe: report links can't be guessed or enumerated. */
export function newReportId() {
  return randomBytes(16).toString("base64url");
}

export function isReportId(value: string) {
  return /^[A-Za-z0-9_-]{22}$/.test(value);
}
