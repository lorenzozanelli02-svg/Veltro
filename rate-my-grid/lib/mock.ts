import type { AiAnalysis, AiCheck, AiEvidence } from "./analysis-schema";
import type { FactId } from "./facts";
import { actionLabel, type Answers, type GoalId } from "./goals";
import type { Report } from "./report";
import { rubricFor } from "./rubric";
import { scoreAnalysis, type ScoringContext } from "./scoring";

/**
 * A stand-in for the AI while building and demoing. It doesn't look at the pictures, but it answers in
 * exactly the AI's format, with evidence quoted from the real (mock) profile, and goes through the same
 * scoring and evidence checks as a real answer. Pages built from it are labelled as demo reports.
 */

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);
const firstWords = (text: string, count: number) => text.trim().split(/\s+/).slice(0, count).join(" ");

const VERDICTS: Record<GoalId, string> = {
  clients: "Good content, but nobody can tell how to hire you.",
  product: "Nice-looking feed that never tells anyone to buy.",
  brand: "Plenty of posts, but no clear thing you're known for.",
  local: "Looks great, but a local wouldn't know where or when to come.",
};

const NEXT_STEP: Record<Answers["action"], string> = {
  dm: "DM me “START” and I'll send you the details",
  book: "Book a free 15-minute call 👇",
  buy: "Shop the range 👇",
  visit: "Book a table or call us 👇",
};

/** Evidence that holds up against whatever account is being scored. */
function evidenceFor(ctx: ScoringContext) {
  if (ctx.kind === "screenshots") {
    const last = Math.max(ctx.count, 1);
    return {
      bio: (): AiEvidence => ({ kind: "screenshot", screenshot: 1, detail: "The bio at the top of your profile" }),
      post: (n: number): AiEvidence => ({ kind: "screenshot", screenshot: Math.min(2, last), detail: `Post ${n} on your grid` }),
      fact: (_id: FactId, detail: string): AiEvidence => ({ kind: "screenshot", screenshot: 1, detail }),
    };
  }
  const { profile } = ctx;
  return {
    bio: (): AiEvidence => ({ kind: "bio", quote: firstWords((profile.bio ?? "").split("\n")[0], 4) }),
    post: (n: number): AiEvidence => {
      const post = profile.posts[Math.min(n, profile.posts.length) - 1];
      const index = Math.min(n, profile.posts.length);
      return { kind: "post", post: index, caption_quote: post ? firstWords(post.caption, 5) : "", detail: "The picture" };
    },
    fact: (id: FactId): AiEvidence => ({ kind: "fact", fact: id }),
  };
}

/** The AI's answer, as the mock gives it: the same judgements every time, so scores are stable. */
export function mockAiAnalysis(goal: GoalId, answers: Answers, ctx: ScoringContext): AiAnalysis {
  const ev = evidenceFor(ctx);
  const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
  const customer = lower(clip(answers.customer, 48));
  const offer = lower(clip(answers.offer, 60));
  const action = lower(actionLabel(answers.action));

  const judged: Record<string, AiCheck> = {
    bio_who: { result: "not_met", reason: "Your bio says what you are, not who you help.", evidence: [ev.bio()] },
    bio_result: { result: "partly", reason: "It hints at what you do but never says what people get.", evidence: [ev.bio()] },
    bio_cta: { result: "not_met", reason: "Nothing in your bio tells people what to do next.", evidence: [ev.bio()] },
    bio_link: { result: "met", reason: "There's a link under your bio.", evidence: [ev.fact("link_in_bio", "The link under your bio")] },
    content_quality: { result: "met", reason: "Your posts are sharp, bright and easy to read on a phone.", evidence: [ev.post(1)] },
    content_goal: { result: "partly", reason: "About half your posts are about your offer; the rest are personal.", evidence: [ev.post(5)] },
    content_formats: { result: "met", reason: "You mix Reels, carousels and photos.", evidence: [ev.fact("format_mix", "Reels and carousels on your grid")] },
    content_captions: { result: "partly", reason: "Some captions teach something; many are one-liners or quotes.", evidence: [ev.post(3)] },
    consistency_frequency: { result: "partly", reason: "You post roughly once or twice a week.", evidence: [ev.fact("posts_per_week", "Dates on your recent posts")] },
    consistency_gaps: { result: "partly", reason: "There's a gap of almost two weeks in your recent posts.", evidence: [ev.fact("longest_gap", "Dates on your recent posts")] },
    consistency_style: { result: "met", reason: "Warm colours and the same photo style run through your grid.", evidence: [ev.post(2)] },
    consistency_topics: { result: "partly", reason: "Fitness tips mix with posts that have nothing to do with what you sell.", evidence: [ev.post(10)] },
    cta_captions: { result: "not_met", reason: "Most captions end without asking people to do anything.", evidence: [ev.fact("captions_with_cta", "Your recent captions")] },
    cta_bio_matches: { result: "not_met", reason: `You want people to ${action}, but your bio doesn't ask them to.`, evidence: [ev.bio()] },
    cta_guides: { result: "partly", reason: "You have highlights, but none of them explains how to work with you.", evidence: [ev.fact("highlights", "Your highlights")] },
    cta_next_step: { result: "not_met", reason: "A new visitor wouldn't know how to start working with you.", evidence: [ev.bio()] },
  };
  const fitResults: AiCheck[] = [
    { result: "partly", reason: "It's implied, but never spelled out.", evidence: [ev.bio()] },
    { result: "met", reason: "Real results show up in your recent posts.", evidence: [ev.post(2)] },
    { result: "partly", reason: `Some posts speak to ${customer}; others could be for anyone.`, evidence: [ev.post(4)] },
    { result: "not_met", reason: "There's no simple, single step to take next.", evidence: [ev.bio()] },
  ];
  rubricFor(goal)[4].checks.forEach((check, i) => (judged[check.id] = fitResults[i]));

  const week = [
    { format: "Reel", task: "Answer the question your customers ask most, in under 30 seconds." },
    { format: "Stories", task: "Behind the scenes of today's work, plus a poll about their biggest problem." },
    { format: "Carousel", task: "A 6-slide breakdown: the mistake, why it happens, and the fix." },
    { format: "Engage", task: "Reply to every comment and DM, then leave 10 genuine comments on accounts your customers follow." },
    { format: "Reel", task: "A result or before/after, with one line on what changed and how." },
    { format: "Stories", task: `Show the offer: what's included, who it's for, and “${clip(actionLabel(answers.action), 40)}”.` },
    { format: "Rest", task: "No posting. Note down the questions people asked this week for next week's content." },
  ] as const;

  return {
    status: "ok",
    problem: "",
    report: {
      checks: judged,
      verdict: VERDICTS[goal],
      free_fixes: [
        {
          title: "Say who you help in the first line of your bio",
          problem: "Your bio opens with a job title and emojis. It doesn't mention who it's for or what they get.",
          fix: `Lead with the person and the result: “Helping ${customer} …”. Put the job title in your name field instead, where Instagram search can find it.`,
          evidence: [ev.bio()],
        },
        {
          title: "Give people one next step",
          problem: "There's no instruction anywhere on the profile, so interested people just scroll away.",
          fix: `End your bio with one action, e.g. “${NEXT_STEP[answers.action]}”, and point your link straight at it rather than your homepage.`,
          evidence: [ev.bio(), ev.fact("captions_with_cta", "Your recent captions")],
        },
        {
          title: "Pin your three best posts",
          problem: "The top of your grid shows whatever you posted last, and a quote graphic gets very few likes.",
          fix: `Pin a result, a post explaining ${clip(offer, 40)}, and one that shows your face. New visitors decide from those three.`,
          evidence: [ev.post(3)],
        },
      ],
      keep: [
        { point: "Showing real results", why: "Proof is what turns a follower into a customer. It's your strongest content.", evidence: [ev.post(2)] },
        { point: "Your consistent colours", why: "The grid looks like one brand, so people recognise your posts in their feed.", evidence: [ev.post(1)] },
      ],
      stop: [
        { point: "Quote graphics", why: "They get the fewest likes on your grid and say nothing about what you sell.", evidence: [ev.post(6)] },
        { point: "Blocks of hashtags", why: "They make captions look spammy. Use 3 to 5 specific ones.", evidence: [ev.post(3)] },
      ],
      start: [
        { point: "Mentioning your offer every week", why: "Most followers have no idea you sell anything. Tell them, plainly, at least once a week.", evidence: [ev.post(9)] },
        { point: "Ending captions with one step", why: "Comments and DMs are where enquiries start. Ask for them.", evidence: [ev.fact("captions_with_cta", "Your recent captions")] },
      ],
      bio: {
        name: clip(`Your Name | ${answers.offer}`, 64),
        text: `Helping ${customer}\n✅ Real results, no guesswork\n${NEXT_STEP[answers.action]}`,
        why: "Line one says who it's for, line two says why you, line three tells them exactly what to do next.",
      },
      post_ideas: [
        { title: "The mistake everyone makes", format: "Reel", hook: "If you're doing this, stop. It's why you're not getting results.", why: "Calls out a problem your customers recognise, so they feel seen and follow." },
        { title: "A client result, step by step", format: "Carousel", hook: "How one client went from stuck to sorted in 8 weeks", why: "Proof plus process: shows it works and how." },
        { title: "What's actually included", format: "Carousel", hook: "Everything you get when you work with me", why: "Removes the guesswork that stops people enquiring." },
        { title: "A day in your work", format: "Reel", hook: "What a Tuesday looks like for me", why: "Puts your face on the brand and builds familiarity." },
        { title: "Myth versus truth", format: "Single image", hook: "You don't need more time. You need a better plan.", why: "Easy to share, and positions you as the expert." },
        { title: "Answer a real DM", format: "Reel", hook: "Someone asked me this today…", why: "Shows you're approachable and invites more questions." },
        { title: "Who this is not for", format: "Carousel", hook: "Don't work with me if…", why: "Filters out the wrong people and makes the right ones lean in." },
        { title: "Your story in 30 seconds", format: "Reel", hook: "Why I started doing this", why: "People buy from people. A good origin story builds trust." },
        { title: "Quick win they can use today", format: "Carousel", hook: "Try this tonight and tell me how it goes", why: "Gives value up front and starts conversations." },
        { title: "Open the doors", format: "Story", hook: "I've got 3 spaces this month. Reply “IN” to grab one.", why: "A direct, time-bound offer is how followers become customers." },
      ],
      plan: {
        summary:
          "Three feed posts a week you can actually keep up, with stories in between so people see the offer, and one day a week spent replying and commenting rather than posting.",
        days: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, ...week[i % 7] })),
      },
    },
  };
}

/** A complete scored demo report. Without an account it's scored as if from three screenshots. */
export function mockReport(goal: GoalId, answers: Answers, ctx: ScoringContext = { kind: "screenshots", count: 3 }): Report {
  return scoreAnalysis(goal, mockAiAnalysis(goal, answers, ctx).report!, ctx).report;
}
