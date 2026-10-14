import type { AnalysisInput } from "./analysis-prompt";
import { aiMode } from "./config";
import { profileMetrics } from "./lookup/metrics";
import { mockReport } from "./mock";
import type { AnalysisOutcome } from "./report";

export type { AnalysisInput } from "./analysis-prompt";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function mockAnalyze({ goal, answers, source }: AnalysisInput): Promise<AnalysisOutcome> {
  await sleep(Number(process.env.MOCK_AI_DELAY_MS ?? 5000));
  // Set MOCK_AI_RESULT to try the error screens without real screenshots.
  if (source.kind === "screenshots" && process.env.MOCK_AI_RESULT === "not_instagram") {
    return { status: "not_instagram", message: "These don't look like Instagram screenshots. We need your profile page, your grid and a recent post." };
  }
  if (source.kind === "screenshots" && process.env.MOCK_AI_RESULT === "unreadable") {
    return { status: "unreadable", message: "We couldn't read these screenshots. They're too blurry or cropped to see your bio and posts." };
  }
  const metrics = source.kind === "profile" ? profileMetrics(source.lookup.profile) : undefined;
  return { status: "ok", report: mockReport(goal, answers, metrics) };
}

/**
 * Scores an account. The live version sends buildAnalysisContent(input) with SYSTEM_PROMPT to Claude
 * (see lib/analysis-prompt.ts); it's connected in the next step.
 */
export async function analyzeAccount(input: AnalysisInput): Promise<AnalysisOutcome> {
  const mode = aiMode();
  if (mode === "mock") return mockAnalyze(input);
  throw new Error(mode === "off" ? "ANTHROPIC_API_KEY is not set" : "Live analysis is not connected yet");
}
