"use client";

import { ChevronRight, MapPin, ShoppingBag, Sparkles, Users } from "lucide-react";
import { GOALS, type GoalId } from "@/lib/goals";
import { StepHeading } from "./StepHeading";

const ICONS: Record<GoalId, typeof Users> = {
  clients: Users,
  product: ShoppingBag,
  brand: Sparkles,
  local: MapPin,
};

export function GoalStep({ value, onChoose }: { value: GoalId | null; onChoose: (goal: GoalId) => void }) {
  return (
    <>
      <StepHeading title={<>What&rsquo;s your Instagram <span className="text-ig">for?</span></>}>
        Everything is judged against this.
      </StepHeading>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {GOALS.map((goal) => {
          const Icon = ICONS[goal.id];
          return (
            <button
              key={goal.id}
              type="button"
              aria-pressed={value === goal.id}
              onClick={() => onChoose(goal.id)}
              className="group flex min-h-22 w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-accent/50 aria-pressed:border-accent aria-pressed:bg-accent/8 sm:min-h-36 sm:flex-col sm:items-start sm:p-5"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-raised text-accent ring-1 ring-line group-aria-pressed:bg-ig group-aria-pressed:text-white">
                <Icon aria-hidden="true" className="size-6" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg leading-snug font-semibold">{goal.label}</span>
                <span className="mt-0.5 block text-sm text-muted">{goal.blurb}</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted group-hover:text-accent sm:hidden" />
            </button>
          );
        })}
      </div>
    </>
  );
}
