"use client";

import { useId, useState } from "react";
import { ACTIONS, AnswersSchema, FREQUENCIES, goalById, LIMITS, type Answers, type GoalId } from "@/lib/goals";
import { Arrow, buttonClass } from "../Button";
import { STEP_ACTIONS, StepLayout } from "./StepHeading";

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
    <StepLayout
      title="Four quick"
      accent="questions"
      intro="Short answers are fine. They make your score specific to you."
      aside={
        <p className="glass mt-6 hidden rounded-full px-4 py-2 font-mono text-xs tracking-[0.16em] text-soft uppercase lg:inline-flex">
          Goal: {hints.label}
        </p>
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="space-y-9">
          <TextQuestion
            number={1}
            label="Who's your ideal customer?"
            placeholder={hints.customerHint}
            value={value.customer}
            max={LIMITS.customer}
            error={showErrors && missing.customer ? "Tell us who you want to reach." : null}
            onChange={(customer) => onChange({ ...value, customer })}
          />
          <TextQuestion
            number={2}
            label="What do you sell?"
            placeholder={hints.offerHint}
            value={value.offer}
            max={LIMITS.offer}
            error={showErrors && missing.offer ? "Tell us what you offer, even roughly." : null}
            onChange={(offer) => onChange({ ...value, offer })}
          />
          <ChoiceQuestion
            number={3}
            label="How often do you post?"
            options={FREQUENCIES}
            value={value.frequency}
            error={showErrors && missing.frequency ? "Pick the closest one." : null}
            onChange={(frequency) => onChange({ ...value, frequency })}
          />
          <ChoiceQuestion
            number={4}
            label="What should people do after finding you?"
            options={ACTIONS}
            value={value.action}
            error={showErrors && missing.action ? "Pick the one that matters most." : null}
            onChange={(action) => onChange({ ...value, action })}
          />
        </div>

        <div className={`${STEP_ACTIONS} mt-10 lg:flex lg:justify-end`}>
          <button type="submit" className={buttonClass({ className: "w-full lg:w-auto lg:min-w-64" })}>
            Continue
            <Arrow />
          </button>
        </div>
      </form>
    </StepLayout>
  );
}

/** "01 / 04" above each question; hidden from screen readers, which already announce the field. */
function QuestionNumber({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="mb-2.5 block font-mono text-xs font-normal tracking-[0.2em] text-soft/80">
      0{n} / 04
    </span>
  );
}

function TextQuestion({
  number,
  label,
  placeholder,
  value,
  max,
  error,
  onChange,
}: {
  number: number;
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
      <QuestionNumber n={number} />
      <label htmlFor={id} className="block text-lg font-medium text-slate-50">
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
        className="glass mt-3 h-14 w-full rounded-2xl px-4 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none aria-invalid:border-bad"
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
  number,
  label,
  options,
  value,
  error,
  onChange,
}: {
  number: number;
  label: string;
  options: readonly { id: T; label: string }[];
  value: T | undefined;
  error: string | null;
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined} data-invalid={error ? true : undefined}>
      <legend className="text-lg font-medium text-slate-50">
        <QuestionNumber n={number} />
        {label}
      </legend>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {options.map((option) => (
          <label
            key={option.id}
            className="glass flex min-h-14 cursor-pointer items-center rounded-2xl px-4 py-3 text-[15px] leading-snug text-soft transition-colors hover:border-slate-300/35 has-checked:border-accent/80 has-checked:bg-accent/10 has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-accent"
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
