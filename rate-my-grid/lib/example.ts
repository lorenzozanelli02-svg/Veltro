import type { Report } from "./report";

/** The made-up result shown on the landing page so people see what they'll get. */
export const EXAMPLE: Pick<Report, "score" | "verdict" | "categories"> & { fix: string } = {
  score: 62,
  verdict: "Great content. Nobody knows how to hire you.",
  categories: {
    bio: { score: 48, note: "" },
    content: { score: 81, note: "" },
    consistency: { score: 57, note: "" },
    callToAction: { score: 29, note: "" },
    goalFit: { score: 66, note: "" },
  },
  fix: "Your link goes to your homepage. Point it straight at your booking page and say so in your bio.",
};
