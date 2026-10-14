"use client";

import { AtSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { parseInstagramHandle } from "@/lib/instagram-handle";
import { Arrow, buttonClass } from "../Button";

/**
 * The homepage's Instagram box. It starts the scoring flow with the username filled in; the flow looks
 * the account up when they reach that step. Without JavaScript it's a plain form that does the same.
 */
export function HeroForm() {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parsed = parseInstagramHandle(value);
  // Show the cleaned-up name when someone pastes a link or adds an @, so they know what will be looked up.
  const cleaned = parsed.ok && parsed.username !== value.trim() ? parsed.username : null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    router.push(`/?step=goal&ig=${encodeURIComponent(parsed.username)}`, { scroll: false });
  }

  return (
    <form action="/" method="get" onSubmit={submit} noValidate className="mx-auto w-full max-w-xl">
      <input type="hidden" name="step" value="goal" />
      <label htmlFor={id} className="sr-only">
        Your Instagram profile link or username
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:border sm:border-line sm:bg-surface/90 sm:p-1.5 sm:shadow-2xl sm:shadow-black/50 sm:transition-colors sm:focus-within:border-accent/70 sm:has-[[aria-invalid]]:border-bad">
        <div className="relative flex-1">
          <AtSign aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <input
            id={id}
            name="ig"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="Your Instagram link or @username"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-hint`}
            className="h-14 w-full rounded-2xl border border-line bg-surface pr-4 pl-12 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none aria-invalid:border-bad sm:h-12 sm:rounded-full sm:border-0 sm:bg-transparent"
          />
        </div>
        <button type="submit" className={buttonClass({ className: "w-full shrink-0 sm:min-h-12 sm:w-auto" })}>
          Get my score
          <Arrow />
        </button>
      </div>
      <p id={`${id}-hint`} aria-live="polite" className={`mt-3 min-h-5 text-sm ${error ? "text-bad" : "text-muted"}`}>
        {error ?? (cleaned ? `We'll look up @${cleaned}` : null)}
      </p>
    </form>
  );
}
