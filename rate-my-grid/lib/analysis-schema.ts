import { z } from "zod";
import { FACT_IDS } from "./facts";
import { PLAN_FORMATS, POST_FORMATS } from "./report";

/**
 * The exact JSON the AI must return (enforced with structured outputs). It judges each rubric check and
 * points at evidence; it never gives numbers or totals. The server verifies the evidence and does the
 * scoring (lib/scoring.ts).
 */

const AiEvidence = z.union([
  z.object({
    kind: z.literal("bio"),
    quote: z.string().describe("Words copied exactly, character for character, from their bio. Empty only when the bio itself is empty."),
  }),
  z.object({
    kind: z.literal("name"),
    quote: z.string().describe("Words copied exactly from their name field."),
  }),
  z.object({
    kind: z.literal("post"),
    post: z.number().int().describe("The post number from the data and image labels (1 = newest)."),
    caption_quote: z.string().describe("Words copied exactly from that post's caption, or empty when you're pointing at the picture."),
    detail: z.string().describe("What in that post shows this, in a few words."),
  }),
  z.object({
    kind: z.literal("fact"),
    fact: z.enum(FACT_IDS).describe("The id of one of the account's facts, exactly as listed."),
  }),
  z.object({
    kind: z.literal("screenshot"),
    screenshot: z.number().int().describe("The screenshot number."),
    detail: z.string().describe("What's visible there, quoting any words exactly."),
  }),
]);

export type AiEvidence = z.infer<typeof AiEvidence>;

const evidence = z.array(AiEvidence).describe("At least one piece of evidence from their profile. Feedback without evidence is thrown away.");

const AiCheck = z.object({
  result: z.enum(["met", "partly", "not_met"]),
  reason: z.string().describe("One short sentence, addressed to them, on what you saw."),
  evidence,
});

export type AiCheck = z.infer<typeof AiCheck>;

const AiPoint = z.object({ point: z.string(), why: z.string(), evidence });

/** The schema for one request: `checkIds` are the rubric checks the AI must judge this time. */
export function analysisSchema(checkIds: string[]) {
  return z.object({
    status: z.enum(["ok", "not_instagram", "unreadable"]),
    problem: z.string().describe("Only when status is not ok: a short, friendly message saying what's needed. Otherwise an empty string."),
    report: z
      .object({
        checks: z.object(Object.fromEntries(checkIds.map((id) => [id, AiCheck]))),
        verdict: z.string().describe("One honest, specific line of at most 110 characters."),
        free_fixes: z
          .array(z.object({ title: z.string(), problem: z.string(), fix: z.string(), evidence }))
          .describe("The two or three changes that would raise the score most, most important first."),
        keep: z.array(AiPoint),
        stop: z.array(AiPoint),
        start: z.array(AiPoint),
        bio: z.object({
          name: z.string().describe("Name field, at most 64 characters."),
          text: z.string().describe("Bio, at most 150 characters including line breaks."),
          why: z.string(),
        }),
        post_ideas: z.array(z.object({ title: z.string(), format: z.enum(POST_FORMATS), hook: z.string(), why: z.string() })).describe("Exactly 10."),
        plan: z.object({
          summary: z.string(),
          days: z.array(z.object({ day: z.number().int(), format: z.enum(PLAN_FORMATS), task: z.string() })).describe("Days 1 to 30, one each, in order."),
        }),
      })
      .nullable()
      .describe("Null when status is not ok."),
  });
}

export type AiAnalysis = {
  status: "ok" | "not_instagram" | "unreadable";
  problem: string;
  report: {
    checks: Record<string, AiCheck>;
    verdict: string;
    free_fixes: { title: string; problem: string; fix: string; evidence: AiEvidence[] }[];
    keep: { point: string; why: string; evidence: AiEvidence[] }[];
    stop: { point: string; why: string; evidence: AiEvidence[] }[];
    start: { point: string; why: string; evidence: AiEvidence[] }[];
    bio: { name: string; text: string; why: string };
    post_ideas: { title: string; format: (typeof POST_FORMATS)[number]; hook: string; why: string }[];
    plan: { summary: string; days: { day: number; format: (typeof PLAN_FORMATS)[number]; task: string }[] };
  } | null;
};
