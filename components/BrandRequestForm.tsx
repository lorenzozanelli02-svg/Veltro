"use client";

import { CircleCheck, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const input =
  "h-12 w-full rounded-[var(--radius-control)] border border-line bg-white px-4 text-base outline-none transition-colors placeholder:text-faint hover:border-[#d6d3cf] focus:border-ink";

export function BrandRequestForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const brand = String(form.get("brand_name") ?? "").trim();
    if (!brand) {
      setError("Please enter a brand name.");
      return;
    }
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/brand-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState("done");
    } catch (err) {
      setState("idle");
      setError((err as Error).message || "Something went wrong. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="animate-rise mt-8 rounded-[var(--radius-card)] bg-good-soft p-6 text-center">
        <CircleCheck aria-hidden="true" className="mx-auto size-8 text-good" />
        <p className="mt-3 font-semibold">Thanks, we&rsquo;ve got it.</p>
        <p className="mt-1 text-[15px] text-muted">We&rsquo;ll add the brand as soon as we can.</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => setState("idle")} className="min-h-11 cursor-pointer rounded-xl border border-line bg-white px-4 text-sm font-medium hover:border-ink">
            Request another
          </button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-ink px-4 text-sm font-medium text-white">
            Back to the converter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-5">
      <div>
        <label htmlFor="brand_name" className="mb-1.5 block text-[15px] font-medium">
          Brand name <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="brand_name"
          name="brand_name"
          required
          maxLength={120}
          autoComplete="off"
          aria-invalid={Boolean(error && error.includes("brand")) || undefined}
          aria-describedby={error ? "req-error" : undefined}
          className={input}
          placeholder="e.g. a brand you love"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[15px] font-medium">
          Email <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={200} className={input} placeholder="you@example.com" aria-describedby="email-help" />
        <p id="email-help" className="mt-1.5 text-[13px] text-muted">
          We&rsquo;ll only use it to tell you when the brand is added.
        </p>
      </div>
      <div aria-hidden="true" className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && (
        <p id="req-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent text-[17px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-80"
      >
        {state === "sending" && <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />}
        Send request
      </button>
    </form>
  );
}
