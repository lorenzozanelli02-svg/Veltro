import type { Report } from "./report";

/**
 * The made-up result shown on the landing page so people see what they'll get. It's for an invented
 * account (no real person's handle or photo) and is kept consistent with how real reports are scored:
 * the overall score leans on call to action and fit with goal, as the analysis prompt asks.
 */
export const EXAMPLE = {
  account: { description: "Online fitness coach", followers: 2431, postsLast30Days: 6 },
  goalLabel: "Get clients",
  // Bio, content and consistency count once; call to action and fit with goal count twice:
  // (48 + 81 + 57 + 2 × 29 + 2 × 55) / 7 = 50.6, so 51.
  score: 51,
  verdict: "Great content. Nobody knows how to hire you.",
  categories: {
    bio: { score: 48, note: "" },
    content: { score: 81, note: "" },
    consistency: { score: 57, note: "" },
    callToAction: { score: 29, note: "" },
    goalFit: { score: 55, note: "" },
  },
  fix: {
    title: "Point your link at your booking page",
    problem: "Your link goes to your homepage, and nothing on your profile says how to work with you.",
    fix: "Link straight to your booking page and end your bio with “Book a free call 👇”.",
  },
  // From the paid report: their bio now, and the rewrite (Instagram's limit is 150 characters).
  bio: {
    before: "Coach 💪 | Mum of 2 | 🏋️‍♀️\nLiving my best life ✨",
    after: "Helping busy mums get fit in 20 minutes a day\n✅ 200+ women coached online\nBook a free call 👇",
  },
} satisfies Pick<Report, "score" | "verdict" | "categories"> & Record<string, unknown>;
