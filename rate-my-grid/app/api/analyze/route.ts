import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeScreenshots } from "@/lib/analyze";
import { aiMode } from "@/lib/config";
import { AnswersSchema, GOAL_IDS } from "@/lib/goals";
import { newReportId } from "@/lib/ids";
import { readScreenshots } from "@/lib/images";
import { checkRateLimit, visitorKey } from "@/lib/ratelimit";
import { saveReport } from "@/lib/store";

// Reading 5 screenshots and writing the full report can take a minute or two.
export const maxDuration = 300;

const error = (status: number, code: string, message: string, headers?: HeadersInit) =>
  NextResponse.json({ error: code, message }, { status, headers });

export async function POST(request: Request) {
  // Only real analyses cost money, so only those are rate limited.
  if (aiMode() === "live") {
    const limit = await checkRateLimit(visitorKey(request.headers));
    if (!limit.ok) {
      const message =
        limit.scope === "global"
          ? "We've hit today's limit for new scores. Please try again tomorrow."
          : "You've run a few scores in a row. Please wait a little and try again.";
      return error(429, "rate_limited", message, { "Retry-After": String(limit.retryAfterSeconds) });
    }
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "bad_request", "That upload didn't come through. Please try again.");
  }

  const goal = z.enum(GOAL_IDS).safeParse(form.get("goal"));
  let answersJson: unknown = null;
  try {
    answersJson = JSON.parse(String(form.get("answers") ?? ""));
  } catch {}
  const answers = AnswersSchema.safeParse(answersJson);
  if (!goal.success || !answers.success) {
    return error(400, "bad_request", "Some answers are missing. Go back and check the questions.");
  }

  const screenshots = await readScreenshots(form.getAll("screenshots"));
  if (!screenshots.ok) return error(400, "bad_upload", screenshots.error);

  // Screenshots only ever live in this function's memory. They're never written to disk or storage,
  // and are gone as soon as this request finishes.
  let outcome;
  try {
    outcome = await analyzeScreenshots({ goal: goal.data, answers: answers.data, screenshots: screenshots.images });
  } catch (err) {
    console.error("analysis failed", err);
    return error(502, "analysis_failed", "Something went wrong while scoring your profile. Please try again.");
  }

  if (outcome.status !== "ok") return error(422, outcome.status, outcome.message);

  const id = newReportId();
  await saveReport({
    id,
    createdAt: new Date().toISOString(),
    goal: goal.data,
    answers: answers.data,
    report: outcome.report,
    paid: false,
    demo: aiMode() === "mock",
  });
  return NextResponse.json({ id });
}
