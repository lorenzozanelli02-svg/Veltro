import { z } from "zod";

export const GOALS = [
  {
    id: "clients",
    label: "Get clients",
    blurb: "Coaching, services, consulting",
    customerHint: "e.g. Busy mums who want to get fit",
    offerHint: "e.g. Online coaching, £150 a month",
  },
  {
    id: "product",
    label: "Sell a product",
    blurb: "Physical or digital products",
    customerHint: "e.g. Runners training for a marathon",
    offerHint: "e.g. Recovery balms, £18 to £30",
  },
  {
    id: "brand",
    label: "Build a personal brand",
    blurb: "Be known for something",
    customerHint: "e.g. First-time founders in tech",
    offerHint: "e.g. Talks, a newsletter, a course",
  },
  {
    id: "local",
    label: "Grow a local business",
    blurb: "Bring people through the door",
    customerHint: "e.g. Families near Leeds city centre",
    offerHint: "e.g. Brunch café, weekend bookings",
  },
] as const;

export type GoalId = (typeof GOALS)[number]["id"];
export const GOAL_IDS = GOALS.map((g) => g.id) as [GoalId, ...GoalId[]];

export function goalById(id: GoalId) {
  return GOALS.find((g) => g.id === id)!;
}

export const FREQUENCIES = [
  { id: "daily", label: "Most days" },
  { id: "weekly-plus", label: "2 to 4 times a week" },
  { id: "weekly", label: "About once a week" },
  { id: "rarely", label: "Less than once a week" },
] as const;

export const ACTIONS = [
  { id: "dm", label: "Send me a DM" },
  { id: "book", label: "Book a call or session" },
  { id: "buy", label: "Buy from my link" },
  { id: "visit", label: "Visit, call or book my business" },
] as const;

type FrequencyId = (typeof FREQUENCIES)[number]["id"];
type ActionId = (typeof ACTIONS)[number]["id"];

export const LIMITS = { customer: 140, offer: 140 } as const;

export const AnswersSchema = z.object({
  customer: z.string().trim().min(3).max(LIMITS.customer),
  offer: z.string().trim().min(3).max(LIMITS.offer),
  frequency: z.enum(FREQUENCIES.map((f) => f.id) as [FrequencyId, ...FrequencyId[]]),
  action: z.enum(ACTIONS.map((a) => a.id) as [ActionId, ...ActionId[]]),
});

export type Answers = z.infer<typeof AnswersSchema>;

export function frequencyLabel(id: Answers["frequency"]) {
  return FREQUENCIES.find((f) => f.id === id)!.label;
}

export function actionLabel(id: Answers["action"]) {
  return ACTIONS.find((a) => a.id === id)!.label;
}
