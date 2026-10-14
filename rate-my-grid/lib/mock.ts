import { actionLabel, type Answers, type GoalId } from "./goals";
import type { ProfileMetrics } from "./lookup/metrics";
import type { FullReport, Report } from "./report";

/**
 * A believable report for building and demoing the flow without calling the AI.
 * It doesn't look at the screenshots; pages built from it are labelled as demo reports.
 */

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

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

function plan(answers: Answers): FullReport["plan"] {
  // Weekly rhythm: three feed posts, stories in between, one engagement day and one rest day.
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
    summary:
      "Three feed posts a week you can actually keep up, with stories in between so people see the offer, and one day a week spent replying and commenting rather than posting.",
    days: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, ...week[i % 7] })),
  };
}

/** With metrics from a looked-up profile, the content and consistency notes quote the real numbers. */
function metricNotes(m: ProfileMetrics) {
  const best = (Object.entries(m.engagementByFormat) as [string, number][]).sort((a, b) => b[1] - a[1])[0];
  const content = m.likesHidden
    ? "Your like counts are hidden, so engagement is judged on comments: they're low for the size of the account."
    : `Each post gets ${m.avgLikes} likes and ${m.avgComments} comments on average, ${m.engagementRate ?? "an unknown"}% of your followers.${best ? ` ${best[0] === "Carousel" ? "Carousels" : `${best[0]}s`} do best.` : ""}`;
  const consistency = `${m.postsLast30Days} post${m.postsLast30Days === 1 ? "" : "s"} in the last 30 days${
    m.daysSinceLastPost === null ? "" : `, the latest ${m.daysSinceLastPost} day${m.daysSinceLastPost === 1 ? "" : "s"} ago`
  }. ${m.avgDaysBetweenPosts && m.avgDaysBetweenPosts > 5 ? `That's a post every ${m.avgDaysBetweenPosts} days on average.` : "A steady rhythm."}`;
  return { content, consistency };
}

export function mockReport(goal: GoalId, answers: Answers, metrics?: ProfileMetrics): Report {
  const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
  const customer = lower(clip(answers.customer, 48));
  const offer = lower(clip(answers.offer, 60));
  const report: Report = {
    score: 58,
    verdict: VERDICTS[goal],
    summary: `Your posts are clear and your results are real, which is the hard part. But a new visitor can't tell who you help or what to do next, so the interest your content earns mostly scrolls away. Fix the bio and give people one next step, and the same posts will start bringing in ${clip(customer, 40)}.`,
    categories: {
      bio: {
        score: 44,
        note: "Says what you are, but not who you help or what they get. Someone landing here has to guess.",
      },
      content: {
        score: 71,
        note: "Clear, well-lit posts and real results. Your Reels get roughly three times the likes of your photos.",
      },
      consistency: {
        score: 52,
        note: "Three posts in the last month, then a 12-day gap. The grid looks active, then stops.",
      },
      callToAction: {
        score: 31,
        note: "No offer, no clear next step, and the link goes to a homepage instead of somewhere to act.",
      },
      goalFit: {
        score: 62,
        note: `The posts would interest ${customer}, but the profile doesn't turn that interest into action.`,
      },
    },
    freeFixes: [
      {
        title: "Say who you help in the first line of your bio",
        problem: "Your bio opens with a job title and emojis. It doesn't mention who it's for or what they get.",
        fix: `Lead with the person and the result: “Helping ${customer} …”. Put the job title in your name field instead, where Instagram search can find it.`,
      },
      {
        title: "Give people one next step",
        problem: "There's no instruction anywhere on the profile, so interested people just scroll away.",
        fix: `End your bio with one action, e.g. “${NEXT_STEP[answers.action]}”, and point your link straight at it rather than your homepage.`,
      },
      {
        title: "Pin your three best posts",
        problem: "The top of your grid shows whatever you posted last, which is a quote graphic with very few likes.",
        fix: `Pin a result, a post explaining ${clip(offer, 40)}, and one that shows your face. New visitors decide from those three.`,
      },
    ],
    strengths: [
      {
        title: "Talking-to-camera Reels",
        detail: "Your Reels where you speak to camera get about three times the likes of your photos. They build trust faster than anything else on the grid.",
      },
      {
        title: "Real client results",
        detail: "The before-and-after posts are specific and believable. Proof like this is what turns a follower into an enquiry.",
      },
      {
        title: "A grid that looks like one brand",
        detail: "Consistent colours and lighting mean people recognise your posts in their feed before they read a word.",
      },
    ],
    full: {
      keep: [
        { point: "Your Reels with you talking to camera", why: "They get the most likes and comments on your grid, and they build trust faster than graphics." },
        { point: "Showing real results", why: "Proof is what turns a follower into a customer. It's your strongest content." },
        { point: "Your consistent colours", why: "The grid looks like one brand, so people recognise your posts in their feed." },
      ],
      stop: [
        { point: "Quote graphics", why: "They're your lowest-performing posts and say nothing about what you sell." },
        { point: "Hashtag blocks of 30 tags", why: "They make captions look spammy and bring in the wrong audience. Use 3 to 5 specific ones." },
        { point: "Long gaps between posts", why: "Each gap resets your momentum. A lighter schedule you can keep beats bursts." },
      ],
      start: [
        { point: "Mentioning your offer every week", why: "Most followers have no idea you sell anything. Tell them, plainly, at least once a week." },
        { point: "Ending captions with a question or a step", why: "Comments and DMs are where enquiries start. Ask for them." },
        { point: "Using Highlights as a sales page", why: "Make highlights for Results, How it works, and FAQs so people can self-serve." },
      ],
      bio: {
        name: clip(`Your Name | ${answers.offer}`, 64),
        text: clip(`Helping ${customer}\n✅ Real results, no guesswork\n${NEXT_STEP[answers.action]}`, 150),
        why: "Line one says who it's for, line two says why you, line three tells them exactly what to do next.",
      },
      postIdeas: [
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
      plan: plan(answers),
    },
  };
  if (metrics) {
    const notes = metricNotes(metrics);
    report.categories.content.note = notes.content;
    report.categories.consistency.note = notes.consistency;
  }
  return report;
}
