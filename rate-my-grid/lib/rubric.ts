import type { FactId } from "./facts";
import type { GoalId } from "./goals";
import type { ProfileMetrics } from "./lookup/metrics";
import type { Profile } from "./lookup/types";

/**
 * THE SCORING RUBRIC. Edit this file to change how accounts are scored.
 *
 * - Five categories, each made of checks. With the default points every category adds up to 20 and the
 *   whole score to 100. If you change the points, the total is scaled back to 100 automatically.
 * - For each check the AI decides "met", "partly" or "not met" (using `guide`), with a reason and the
 *   evidence from their profile. The server turns that into points: `points` for met, `partly` for
 *   partly, 0 for not met, and adds everything up. The AI never does the arithmetic.
 * - Checks with `measure` are scored here in code from the account's numbers instead of by the AI,
 *   whenever we have them (a username lookup). From screenshots, the AI judges those too.
 * - "Fit with goal" has its own four checks for each goal, further down.
 *
 * Bump RUBRIC_VERSION whenever you change checks or points, so reports show which rubric scored them.
 */
export const RUBRIC_VERSION = 1;

export type CheckResult = "met" | "partly" | "not_met";

/** What code decided for a measured check, and the fact that decided it. */
export type Measurement = { result: CheckResult; reason: string; fact: FactId };

export type RubricCheck = {
  /** Stable id, used in the AI's answer. Lowercase letters and underscores. */
  id: string;
  /** Shown in the report. */
  label: string;
  /** Points for "met". */
  points: number;
  /** Points for "partly". */
  partly: number;
  /** What the AI is told each result means. */
  guide: string;
  /** Scores the check from the numbers when we have them (username lookups). */
  measure?: (account: { profile: Profile; metrics: ProfileMetrics }) => Measurement;
};

export type RubricCategoryKey = "bio" | "content" | "consistency" | "callToAction" | "goalFit";

export type RubricCategory = { key: RubricCategoryKey; label: string; checks: RubricCheck[] };

const BIO: RubricCategory = {
  key: "bio",
  label: "Bio",
  checks: [
    {
      id: "bio_who",
      label: "Says who they help",
      points: 5,
      partly: 2,
      guide:
        "Met: the bio or name field names a specific type of person or business they serve. Partly: a vague audience (\"everyone\", \"women\") or one you have to work out. Not met: no audience at all, just a job title or personal details.",
    },
    {
      id: "bio_result",
      label: "States the result or offer",
      points: 5,
      partly: 2,
      guide:
        "Met: says what people get (a result, a service or the products) in plain words. Partly: hints at it, or only names a job title. Not met: nothing about what they offer.",
    },
    {
      id: "bio_cta",
      label: "Has a call to action",
      points: 5,
      partly: 2,
      guide:
        "Met: the bio tells people to do something specific (book, DM a word, shop, call). Partly: a weak or generic one (\"link below\", an emoji pointing down with no words). Not met: none.",
    },
    {
      id: "bio_link",
      label: "Has a link in bio",
      points: 5,
      partly: 2,
      guide:
        "Met: a link shows in the bio. Partly: a link is mentioned but not clickable (written in the bio text). Not met: no link.",
      measure: ({ profile }) => {
        const url = profile.externalUrl;
        const valid = url !== null && /^https?:\/\/[^\s/$.?#][^\s]*$/i.test(url.startsWith("http") ? url : `https://${url}`);
        return valid
          ? { result: "met", reason: `There's a link in your bio: ${url}.`, fact: "link_in_bio" }
          : { result: "not_met", reason: "There's no link in your bio, so interested people have nowhere to go.", fact: "link_in_bio" };
      },
    },
  ],
};

const CONTENT: RubricCategory = {
  key: "content",
  label: "Content",
  checks: [
    {
      id: "content_quality",
      label: "Clear visual quality",
      points: 5,
      partly: 2,
      guide:
        "Met: most posts are sharp, well lit and easy to read on a phone. Partly: a mix of good and poor posts. Not met: most are blurry, dark, cluttered or hard to read.",
    },
    {
      id: "content_goal",
      label: "Content matches their goal",
      points: 5,
      partly: 2,
      guide:
        "Met: most posts relate to what they sell and would interest their ideal customer. Partly: around half do; the rest is personal or off-topic. Not met: few posts connect to the offer or customer.",
    },
    {
      id: "content_formats",
      label: "Variety of formats, including Reels",
      points: 5,
      partly: 2,
      guide:
        "Met: Reels make up at least a fifth of posts and at least two formats are used. Partly: some Reels but under a fifth, or several formats but no Reels. Not met: one format only and no Reels.",
      measure: ({ metrics }) => {
        const used = [metrics.formatShare.reels, metrics.formatShare.carousels, metrics.formatShare.images].filter((s) => s > 0).length;
        const reels = metrics.formatShare.reels;
        const mix = `${reels}% of your recent posts are Reels or videos, ${metrics.formatShare.carousels}% carousels and ${metrics.formatShare.images}% single images.`;
        if (reels >= 20 && used >= 2) return { result: "met", reason: mix, fact: "format_mix" };
        if (reels > 0 || used >= 2) return { result: "partly", reason: `${mix} Aim for at least a fifth Reels alongside other formats.`, fact: "format_mix" };
        return { result: "not_met", reason: `${mix} Every recent post is the same format and there are no Reels.`, fact: "format_mix" };
      },
    },
    {
      id: "content_captions",
      label: "Captions add value",
      points: 5,
      partly: 2,
      guide:
        "Met: most captions teach, tell a story or explain something useful to the ideal customer. Partly: some do, many are one-liners, quotes or hashtags. Not met: captions are mostly empty, hashtags or filler.",
    },
  ],
};

const CONSISTENCY: RubricCategory = {
  key: "consistency",
  label: "Consistency",
  checks: [
    {
      id: "consistency_frequency",
      label: "Posts at least 3 times a week",
      points: 5,
      partly: 2,
      guide:
        "Met: 3 or more posts a week recently. Partly: 1 to 3 a week. Not met: less than once a week. (From screenshots, judge from the dates you can see.)",
      measure: ({ metrics }) => {
        const rate = metrics.postsPerWeek ?? 0;
        const reason = `You post ${rate} times a week (${metrics.postsLast30Days} posts in the last 30 days).`;
        if (rate >= 3) return { result: "met", reason, fact: "posts_per_week" };
        if (rate >= 1) return { result: "partly", reason: `${reason} The bar is 3 a week.`, fact: "posts_per_week" };
        return { result: "not_met", reason: `${reason} That's less than once a week; the bar is 3.`, fact: "posts_per_week" };
      },
    },
    {
      id: "consistency_gaps",
      label: "No gaps longer than 10 days",
      points: 5,
      partly: 2,
      guide:
        "Met: no gap of more than 10 days between recent posts, including since the last post. Partly: a gap of 11 to 21 days. Not met: a gap of more than 3 weeks.",
      measure: ({ metrics }) => {
        const gap = metrics.longestGapDays ?? 0;
        const since = metrics.daysSinceLastPost;
        const detail = since !== null && since === gap ? ` (that's the time since your last post)` : "";
        if (gap <= 10) return { result: "met", reason: `Your longest gap between recent posts is ${gap} days.`, fact: "longest_gap" };
        if (gap <= 21) return { result: "partly", reason: `Your longest gap is ${gap} days${detail}. Keep gaps to 10 days or less.`, fact: "longest_gap" };
        return { result: "not_met", reason: `Your longest gap is ${gap} days${detail}, long enough for followers to forget you.`, fact: "longest_gap" };
      },
    },
    {
      id: "consistency_style",
      label: "Recognisable visual style",
      points: 5,
      partly: 2,
      guide:
        "Met: the grid looks like one brand: consistent colours, fonts or photo style. Partly: some consistency with clear outliers. Not met: every post looks different.",
    },
    {
      id: "consistency_topics",
      label: "Consistent topics",
      points: 5,
      partly: 2,
      guide:
        "Met: posts stick to a few clear themes tied to what they do. Partly: mostly on theme with some random posts. Not met: no clear themes.",
    },
  ],
};

const CALL_TO_ACTION: RubricCategory = {
  key: "callToAction",
  label: "Call to action",
  checks: [
    {
      id: "cta_captions",
      label: "Calls to action in captions",
      points: 5,
      partly: 2,
      guide:
        "Met: at least half of recent captions ask the reader to do something (book, DM, comment a word, shop, click the link). Partly: a fifth to a half do. Not met: fewer than a fifth.",
      measure: ({ metrics }) => {
        const share = metrics.postsAnalysed ? metrics.captionsWithCta / metrics.postsAnalysed : 0;
        const reason = `${metrics.captionsWithCta} of your last ${metrics.postsAnalysed} captions ask people to do something.`;
        if (share >= 0.5) return { result: "met", reason, fact: "captions_with_cta" };
        if (share >= 0.2) return { result: "partly", reason: `${reason} Aim for at least half.`, fact: "captions_with_cta" };
        return { result: "not_met", reason: `${reason} Most posts end without telling people what to do next.`, fact: "captions_with_cta" };
      },
    },
    {
      id: "cta_bio_matches",
      label: "Bio's call to action matches their goal",
      points: 5,
      partly: 2,
      guide:
        "Met: the bio asks for the exact step they want (from their answers: DM, book, buy or visit). Partly: a call to action, but for a different step. Not met: no call to action in the bio.",
    },
    {
      id: "cta_guides",
      label: "Highlights or pinned posts guide people to act",
      points: 5,
      partly: 2,
      guide:
        "Met: pinned posts or highlights explain the offer, show proof or say how to buy or book. Partly: they exist but don't lead anywhere. Not met: none, or only personal ones. If highlights aren't in the data, judge from pinned posts and say so.",
    },
    {
      id: "cta_next_step",
      label: "Clear next step for a new visitor",
      points: 5,
      partly: 2,
      guide:
        "Met: someone landing on the profile for the first time would know within seconds exactly how to work with them or buy. Partly: they could work it out with effort. Not met: no idea what to do next.",
    },
  ],
};

const fit = (id: string, label: string, guide: string): RubricCheck => ({ id, label, points: 5, partly: 2, guide });

/** "Fit with goal": four checks for each goal. */
export const FIT_CHECKS: Record<GoalId, RubricCheck[]> = {
  clients: [
    fit("fit_clients_offer", "Clear what you can hire them for", "Met: their services are named and easy to find. Partly: implied but never spelled out. Not met: you can't tell what they'd do for you."),
    fit("fit_clients_proof", "Shows proof of results", "Met: client results, testimonials or case studies appear in recent posts or highlights. Partly: one or two vague mentions. Not met: no proof."),
    fit("fit_clients_audience", "Speaks to their ideal client", "Met: posts and bio address the ideal customer they described, in their language. Partly: sometimes. Not met: written for a general or different audience."),
    fit("fit_clients_enquire", "Easy to enquire or book", "Met: a booking link, DM keyword or contact button makes enquiring a single step. Partly: possible but takes digging. Not met: no obvious way."),
  ],
  product: [
    fit("fit_product_shown", "Products shown clearly", "Met: products appear often, clearly and in use. Partly: shown, but rarely or unclearly. Not met: hard to tell what they sell."),
    fit("fit_product_buy", "Easy to see how to buy", "Met: shop link, tagged products or prices make buying obvious. Partly: buying is possible but not explained. Not met: no way to buy is shown."),
    fit("fit_product_proof", "Social proof", "Met: reviews, customer photos or reposts from buyers appear. Partly: one or two. Not met: none."),
    fit("fit_product_audience", "Speaks to their ideal customer", "Met: content shows the products in the ideal customer's life and speaks to their needs. Partly: sometimes. Not met: generic or aimed at someone else."),
  ],
  brand: [
    fit("fit_brand_niche", "Clear topic they want to be known for", "Met: one or two clear topics run through the bio and posts. Partly: a topic is there but diluted. Not met: no clear topic."),
    fit("fit_brand_face", "Their face and voice appear regularly", "Met: they appear on camera or in photos in many recent posts. Partly: occasionally. Not met: rarely or never."),
    fit("fit_brand_pov", "Shares their own opinions and expertise", "Met: original takes, stories and know-how. Partly: some, mixed with quotes or reposts. Not met: mostly quotes, reposts or trends."),
    fit("fit_brand_audience", "Speaks to the audience they described", "Met: content clearly serves the audience they named. Partly: sometimes. Not met: unclear who it's for."),
  ],
  local: [
    fit("fit_local_where", "Location is clear", "Met: town or area is in the bio or name, and posts are location-tagged. Partly: mentioned somewhere but not obvious. Not met: you can't tell where they are."),
    fit("fit_local_how", "Opening hours or how to book or visit", "Met: hours, booking link or how to visit are easy to find. Partly: partial information. Not met: none."),
    fit("fit_local_inside", "Shows the place, the team and what you get", "Met: posts show the venue, people and products or services in real life. Partly: some. Not met: mostly graphics or stock-style images."),
    fit("fit_local_proof", "Local proof", "Met: reviews, regular customers, local events or tags of nearby accounts appear. Partly: one or two. Not met: none."),
  ],
};

const GOAL_FIT_LABEL = "Fit with goal";

/** The full rubric for one goal, in report order. */
export function rubricFor(goal: GoalId): RubricCategory[] {
  return [BIO, CONTENT, CONSISTENCY, CALL_TO_ACTION, { key: "goalFit", label: GOAL_FIT_LABEL, checks: FIT_CHECKS[goal] }];
}

/** Every check across every goal (for the system prompt, which is the same for everyone). */
export function allChecks(): { category: string; goal: GoalId | null; check: RubricCheck }[] {
  return [
    ...[BIO, CONTENT, CONSISTENCY, CALL_TO_ACTION].flatMap((c) => c.checks.map((check) => ({ category: c.label, goal: null, check }))),
    ...(Object.entries(FIT_CHECKS) as [GoalId, RubricCheck[]][]).flatMap(([goal, checks]) =>
      checks.map((check) => ({ category: GOAL_FIT_LABEL, goal, check })),
    ),
  ];
}

export function pointsFor(check: RubricCheck, result: CheckResult) {
  return result === "met" ? check.points : result === "partly" ? check.partly : 0;
}
