"use client";

import { useId, useState } from "react";
import { ACTIONS, AnswersSchema, FREQUENCIES, goalById, LIMITS, type Answers, type GoalId } from "@/lib/goals";
import { Arrow, buttonClass } from "../Button";
import { StepHeading } from "./StepHeading";

export type DraftAnswers = { customer: string; offer: string; frequency?: Answers["frequency"]; action?: Answers["action"] };

export const EMPTY_ANSWERS: DraftAnswers = { customer: "", offer: "" };

export function DetailsStep({
  goal,
  value,
  onChange,
  onDone,
}: {
  goal: GoalId;
  value: DraftAnswers;
  onChange: (value: DraftAnswers) => void;
  onDone: () => void;
}) {
  const [showErrors, setShowErrors] = useState(false);
  const hints = goalById(goal);
  const missing = {
    customer: value.customer.trim().length < 3,
    offer: value.offer.trim().length < 3,
    frequency: !value.frequency,
    action: !value.action,
  };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (AnswersSchema.safeParse(value).success) return onDone();
    setShowErrors(true);
    const form = event.currentTarget;
    requestAnimationFrame(() => form.querySelector("[aria-invalid], [data-invalid]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  return (
    <form onSubmit={submit} noValidate>
      <StepHeading title={<>Four quick <span className="text-ig">questions</span></>}>
        Short answers are fine. They make your score specific to you.
      </StepHeading>

      <div className="mt-8 space-y-8">
        <TextQuestion
          label="Who's your ideal customer?"
          placeholder={hints.customerHint}
          value={value.customer}
          max={LIMITS.customer}
          error={showErrors && missing.customer ? "Tell us who you want to reach." : null}
          onChange={(customer) => onChange({ ...value, customer })}
        />
        <TextQuestion
          label="What do you sell?"
          placeholder={hints.offerHint}
          value={value.offer}
          max={LIMITS.offer}
          error={showErrors && missing.offer ? "Tell us what you offer, even roughly." : null}
          onChange={(offer) => onChange({ ...value, offer })}
        />
        <ChoiceQuestion
          label="How often do you post?"
          options={FREQUENCIES}
          value={value.frequency}
          error={showErrors && missing.frequency ? "Pick the closest one." : null}
          onChange={(frequency) => onChange({ ...value, frequency })}
        />
        <ChoiceQuestion
          label="What should people do after finding you?"
          options={ACTIONS}
          value={value.action}
          error={showErrors && missing.action ? "Pick the one that matters most." : null}
          onChange={(action) => onChange({ ...value, action })}
        />
      </div>

      <div className="sticky bottom-0 -mx-4 mt-10 bg-linear-to-t from-bg from-60% to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:bg-none sm:px-0">
        <button type="submit" className={buttonClass({ className: "w-full" })}>
          Continue
          <Arrow />
        </button>
      </div>
    </form>
  );
}

function TextQuestion({
  label,
  placeholder,
  value,
  max,
  error,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  max: number;
  error: string | null;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[17px] font-semibold">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={max}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="next"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 h-14 w-full rounded-2xl border border-line bg-surface px-4 text-base text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none aria-invalid:border-bad"
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

function ChoiceQuestion<T extends string>({
  label,
  options,
  value,
  error,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T | undefined;
  error: string | null;
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined} data-invalid={error ? true : undefined}>
      <legend className="text-[17px] font-semibold">{label}</legend>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex min-h-14 cursor-pointer items-center rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] leading-snug font-medium transition-colors hover:border-accent/50 has-checked:border-accent has-checked:bg-accent/8 has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-2 text-sm text-bad">
          {error}
        </p>
      )}
    </fieldset>
  );
}
