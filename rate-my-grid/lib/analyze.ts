import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { buildAnalysisContent, checksForAi, profileData, SYSTEM_PROMPT, type AnalysisInput } from "./analysis-prompt";
import { analysisSchema, type AiAnalysis } from "./analysis-schema";
import { aiMode, analysisEffort, analysisModel, analysisSampling } from "./config";
import { mockAiAnalysis } from "./mock";
import type { Report } from "./report";
import { scoreAnalysis, type ScoringAudit, type ScoringContext } from "./scoring";

export type { AnalysisInput } from "./analysis-prompt";

/** How a run went, for the logs and the admin test page. */
export type AnalysisMeta = {
  model: string;
  ms: number;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheReadTokens: number | null;
};

export type AnalysisOutcome =
  | { status: "ok"; report: Report; audit: ScoringAudit; meta: AnalysisMeta }
  | { status: "not_instagram" | "unreadable"; message: string; meta: AnalysisMeta };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function scoringContext(input: AnalysisInput): ScoringContext {
  if (input.source.kind === "screenshots") return { kind: "screenshots", count: input.source.screenshots.length };
  const { profile } = input.source.lookup;
  return { kind: "profile", profile, ...profileData(input.source.lookup) };
}

/** Asks Claude to judge the rubric checks. Returns its answer exactly as the schema allows. */
async function askClaude(input: AnalysisInput): Promise<{ answer: AiAnalysis; meta: AnalysisMeta }> {
  const model = analysisModel();
  const started = Date.now();
  const client = new Anthropic();
  // Streamed, because the full report is long; finalMessage() still gives the parsed, validated JSON.
  const stream = client.beta.messages.stream({
    model,
    max_tokens: 32000,
    // If the model declines (very unlikely here), Anthropic re-runs it on its recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: {
      effort: analysisEffort(),
      format: betaZodOutputFormat(analysisSchema(checksForAi(input.goal, input.source.kind))),
    },
    ...analysisSampling(model),
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildAnalysisContent(input) }],
  });
  const message = await stream.finalMessage();
  const meta: AnalysisMeta = {
    model: message.model,
    ms: Date.now() - started,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    cacheReadTokens: message.usage.cache_read_input_tokens ?? null,
  };
  console.info(JSON.stringify({ event: "analysis", at: new Date().toISOString(), stop: message.stop_reason, ...meta }));

  if (message.stop_reason === "refusal") throw new Error("The model declined to analyse this account");
  if (message.stop_reason === "max_tokens") throw new Error("The analysis ran out of room before finishing");
  if (!message.parsed_output) throw new Error("The analysis didn't match the expected format");
  return { answer: message.parsed_output as AiAnalysis, meta };
}

async function askMock(input: AnalysisInput, ctx: ScoringContext): Promise<{ answer: AiAnalysis; meta: AnalysisMeta }> {
  const started = Date.now();
  await sleep(Number(process.env.MOCK_AI_DELAY_MS ?? 5000));
  const meta: AnalysisMeta = { model: "mock", ms: Date.now() - started, inputTokens: null, outputTokens: null, cacheReadTokens: null };
  // Set MOCK_AI_RESULT to try the error screens without real screenshots.
  if (input.source.kind === "screenshots" && process.env.MOCK_AI_RESULT === "not_instagram") {
    return { answer: { status: "not_instagram", problem: "These don't look like Instagram screenshots. We need your profile page, your grid and a recent post.", report: null }, meta };
  }
  if (input.source.kind === "screenshots" && process.env.MOCK_AI_RESULT === "unreadable") {
    return { answer: { status: "unreadable", problem: "We couldn't read these screenshots. They're too blurry or cropped to see your bio and posts.", report: null }, meta };
  }
  return { answer: mockAiAnalysis(input.goal, input.answers, ctx), meta };
}

/**
 * Scores an account: Claude (or the mock) judges each rubric check with evidence, then the server
 * verifies the evidence, scores the measurable checks from the numbers and adds everything up.
 */
export async function analyzeAccount(input: AnalysisInput): Promise<AnalysisOutcome> {
  const mode = aiMode();
  if (mode === "off") throw new Error("ANTHROPIC_API_KEY is not set");
  const ctx = scoringContext(input);
  const { answer, meta } = mode === "mock" ? await askMock(input, ctx) : await askClaude(input);

  if (answer.status !== "ok" || !answer.report) {
    const status = answer.status === "ok" ? "unreadable" : answer.status;
    return { status, message: answer.problem || "We couldn't score these screenshots. Try clearer ones of your profile and grid.", meta };
  }
  const { report, audit } = scoreAnalysis(input.goal, answer.report, ctx);
  if (audit.droppedFeedback || audit.unverifiedChecks.length) {
    console.info(JSON.stringify({ event: "analysis_evidence", at: new Date().toISOString(), ...audit }));
  }
  return { status: "ok", report, audit, meta };
}
