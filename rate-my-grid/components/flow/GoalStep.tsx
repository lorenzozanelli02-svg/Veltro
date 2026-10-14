"use client";

import { ChevronRight, MapPin, ShoppingBag, Sparkles, Users } from "lucide-react";
import { GOALS, type GoalId } from "@/lib/goals";
import { StepLayout } from "./StepHeading";

const ICONS: Record<GoalId, typeof Users> = {
  clients: Users,
  product: ShoppingBag,
  brand: Sparkles,
  local: MapPin,
};

export function GoalStep({ value, onChoose }: { value: GoalId | null; onChoose: (goal: GoalId) => void }) {
  return (
    <StepLayout
      title="What’s your Instagram"
      accent="for?"
      intro="Everything is judged against this."
      aside={
        <p className="mt-6 hidden max-w-sm text-[15px] leading-relaxed text-muted lg:block">
          A coach needs DMs and bookings. A café needs people through the door. You&rsquo;re scored on what you want, not
          on follower counts.
        </p>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
        {GOALS.map((goal, i) => {
          const Icon = ICONS[goal.id];
          return (
            <button
              key={goal.id}
              type="button"
              aria-pressed={value === goal.id}
              onClick={() => onChoose(goal.id)}
              className="glass group relative flex min-h-22 w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:border-slate-300/35 hover:bg-slate-800/50 aria-pressed:border-accent/70 aria-pressed:bg-accent/8 sm:min-h-40 sm:flex-col sm:items-start sm:justify-between sm:p-5"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-800/70 text-accent ring-1 ring-slate-400/15 group-aria-pressed:bg-ig group-aria-pressed:text-white group-aria-pressed:ring-0">
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
              </span>
              <span aria-hidden="true" className="absolute top-5 right-5 hidden font-mono text-xs tracking-[0.2em] text-soft/60 tabular-nums sm:block">
                0{i + 1}
              </span>
              <span className="min-w-0 flex-1 sm:flex-none">
                <span className="block text-lg leading-snug font-medium text-slate-50 sm:text-xl sm:font-normal">{goal.label}</span>
                <span className="mt-0.5 block text-sm text-muted sm:mt-1 sm:text-[15px]">{goal.blurb}</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted group-hover:text-ink sm:hidden" />
            </button>
          );
        })}
      </div>
    </StepLayout>
  );
}
