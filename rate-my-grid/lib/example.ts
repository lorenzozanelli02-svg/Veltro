import type { Report } from "./report";

/**
 * The made-up result shown on the landing page so people see what they'll get. It's for an invented
 * account (no real person's handle or photo) and is scored the way real reports are: five categories
 * out of 20 from the rubric's checks (lib/rubric.ts), added up to a total out of 100.
 */
export const EXAMPLE = {
  account: { description: "Online fitness coach", followers: 2431, postsLast30Days: 6 },
  goalLabel: "Get clients",
  // 7 + 17 + 11 + 4 + 9 = 48
  score: 48,
  verdict: "Great content. Nobody knows how to hire you.",
  categories: {
    bio: { score: 7, max: 20 },
    content: { score: 17, max: 20 },
    consistency: { score: 11, max: 20 },
    callToAction: { score: 4, max: 20 },
    goalFit: { score: 9, max: 20 },
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
} satisfies Pick<Report, "score" | "verdict"> & Record<string, unknown>;
