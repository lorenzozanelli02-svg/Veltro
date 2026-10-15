/**
 * Turns whatever someone pastes (a profile link, @handle or plain username) into a clean username.
 * Shared by the browser (instant feedback) and the server (never trust the browser).
 */

// Instagram usernames: up to 30 letters, numbers, full stops and underscores.
const USERNAME = /^[a-z0-9._]{1,30}$/;

// First path segments that are Instagram pages, not accounts.
const NOT_ACCOUNTS = new Set([
  "p",
  "reel",
  "reels",
  "tv",
  "explore",
  "accounts",
  "direct",
  "about",
  "developer",
  "legal",
  "privacy",
  "terms",
  "challenge",
  "web",
  "s",
  "stories",
]);

export type HandleResult = { ok: true; username: string } | { ok: false; message: string };

export function parseInstagramHandle(input: string): HandleResult {
  let text = input.trim();
  if (!text) return { ok: false, message: "Type your Instagram username or paste your profile link." };

  // Anything that looks like a link: take the first part of its path.
  const looksLikeUrl = /instagr(\.am|am\.com)/i.test(text) || /^https?:\/\//i.test(text);
  if (looksLikeUrl) {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    } catch {
      return { ok: false, message: "That link doesn't look right. Try just your username instead." };
    }
    if (!/(^|\.)instagr(\.am|am\.com)$/i.test(url.hostname)) {
      return { ok: false, message: "That's not an Instagram link. Paste your Instagram profile link or type your username." };
    }
    const [first, second] = url.pathname.split("/").filter(Boolean);
    if (!first) return { ok: false, message: "That link doesn't include a username. Paste your profile link instead." };
    // instagram.com/stories/<username>/... still names the account.
    if (first.toLowerCase() === "stories" && second) text = second;
    else if (NOT_ACCOUNTS.has(first.toLowerCase())) {
      return { ok: false, message: "That's a link to a post, not a profile. Paste your profile link or type your username." };
    } else text = first;
  }

  const username = text.replace(/^@+/, "").replace(/\/+$/, "").toLowerCase();
  if (!USERNAME.test(username) || username.startsWith(".") || username.endsWith(".") || username.includes("..")) {
    return { ok: false, message: "That doesn't look like an Instagram username. They only use letters, numbers, full stops and underscores." };
  }
  return { ok: true, username };
}
