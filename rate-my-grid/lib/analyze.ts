import { aiMode } from "./config";
import type { Answers, GoalId } from "./goals";
import type { Screenshot } from "./images";
import { mockReport } from "./mock";
import type { AnalysisOutcome } from "./report";

export type AnalysisInput = { goal: GoalId; answers: Answers; screenshots: Screenshot[] };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function mockAnalyze({ goal, answers }: AnalysisInput): Promise<AnalysisOutcome> {
  await sleep(Number(process.env.MOCK_AI_DELAY_MS ?? 5000));
  // Set MOCK_AI_RESULT to try the error screens without real screenshots.
  if (process.env.MOCK_AI_RESULT === "not_instagram") {
    return { status: "not_instagram", message: "These don't look like Instagram screenshots. We need your profile page, your grid and a recent post." };
  }
  if (process.env.MOCK_AI_RESULT === "unreadable") {
    return { status: "unreadable", message: "We couldn't read these screenshots. They're too blurry or cropped to see your bio and posts." };
  }
  return { status: "ok", report: mockReport(goal, answers) };
}

export async function analyzeScreenshots(input: AnalysisInput): Promise<AnalysisOutcome> {
  const mode = aiMode();
  if (mode === "mock") return mockAnalyze(input);
  throw new Error(mode === "off" ? "ANTHROPIC_API_KEY is not set" : "Live analysis is not connected yet");
}
