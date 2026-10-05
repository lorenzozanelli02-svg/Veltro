"use client";

import { ArrowUpRight, BadgeCheck, Info, MoveHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ConversionResult, SizeRef } from "@/lib/convert";
import type { Category, FitResult, Gender } from "@/lib/types";
import { formatLength, formatRange } from "@/lib/units";
import { Segmented } from "./Segmented";
import { useUnit } from "./useUnit";

export type ConvertResponse = ConversionResult & {
  from: { brand: string; size: string };
  to: { brand: string; slug: string | null; shopUrl: string | null };
};

const MEASURE_LABEL = { chest: "Chest", waist: "Waist", hips: "Hips" } as const;

function sizeText(s: SizeRef) {
  if (!s.region) return s.label;
  return s.label.toUpperCase().startsWith(s.region.toUpperCase()) ? s.label : `${s.region} ${s.label}`;
}

export function ResultCard({ result, gender, category }: { result: ConvertResponse; gender: Gender; category: Category }) {
  const [unit, setUnit] = useUnit();
  const official = result.confidence === "official";
  const showRegion = result.recommended.region && !result.recommended.label.toUpperCase().startsWith(result.recommended.region.toUpperCase());

  return (
    <section
      aria-labelledby="result-heading"
      className="animate-rise overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-20px_rgba(0,0,0,0.18)]"
    >
      <div className="px-5 pb-5 pt-6 text-center sm:px-8">
        <h2 id="result-heading" className="text-[15px] text-muted">
          Your size in <span className="font-semibold text-ink">{result.to.brand}</span>
        </h2>
        <p className="mt-2 flex items-baseline justify-center gap-2">
          {showRegion && <span className="text-xl font-semibold text-faint">{result.recommended.region}</span>}
          <span className="text-[72px] font-bold leading-none tracking-[-0.04em] text-ink tabular-nums">
            {result.recommended.label}
          </span>
        </p>
        <p
          className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ${
            official ? "bg-good-soft text-good" : "bg-accent-soft text-accent-hover"
          }`}
        >
          {official ? <BadgeCheck aria-hidden="true" className="size-4" /> : <Info aria-hidden="true" className="size-4" />}
          {official ? "Based on official size charts" : "Estimate based on standard sizing"}
        </p>
        <p className="mt-3 text-[13px] text-muted">
          Converted from {result.from.brand} {result.from.size}
        </p>
      </div>

      {(result.alternate || result.secondary.length > 0 || result.notes.length > 0) && (
        <div className="space-y-2 px-5 pb-5 sm:px-8">
          {result.alternate && (
            <div className="flex gap-3 rounded-2xl bg-soft p-4 text-left">
              <MoveHorizontal aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
              <div className="text-[15px] leading-snug">
                <p className="font-semibold">
                  Or size {sizeText(result.alternate)}{" "}
                  <span className="font-normal text-muted">(one size {result.alternate.direction})</span>
                </p>
                <p className="mt-1 text-muted">Between sizes? Go up for a looser fit, down for a tighter fit.</p>
              </div>
            </div>
          )}
          {result.secondary.map((s) => (
            <p key={s.measure} className="rounded-2xl bg-soft px-4 py-3 text-left text-[15px] text-ink">
              Your {s.measure} measurement suggests size {sizeText(s.size)}.
            </p>
          ))}
          {result.notes.map((n) => (
            <p key={n} className="px-1 text-left text-[13px] leading-relaxed text-muted">
              {n}
            </p>
          ))}
        </div>
      )}

      <div className="border-t border-line px-5 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold">Based on these measurements</h3>
          <div className="w-28">
            <Segmented
              name="unit"
              legend="Units"
              size="sm"
              value={unit}
              onChange={setUnit}
              options={[
                { value: "cm", label: "cm" },
                { value: "in", label: "in" },
              ]}
            />
          </div>
        </div>
        <dl className="mt-3 divide-y divide-line">
          {result.basis.map((b) => (
            <div key={b.measure} className="flex items-center justify-between py-2.5 text-[15px]">
              <dt className="flex items-center gap-2 text-muted">
                {MEASURE_LABEL[b.measure]}
                {b.primary && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-hover">
                    Used
                  </span>
                )}
              </dt>
              <dd className="tabular-nums">
                {formatRange(b.min, b.max, unit)} {unit}
                {b.primary && b.max > b.min && (
                  <span className="ml-1.5 text-muted">
                    (mid {formatLength(b.mid, unit)})
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="space-y-5 border-t border-line px-5 py-5 sm:px-8">
        {result.to.shopUrl ? (
          <a
            href={result.to.shopUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ink py-3.5 text-base font-semibold text-white transition-colors hover:bg-black"
          >
            Shop {result.to.brand}
            <ArrowUpRight aria-hidden="true" className="size-5" />
          </a>
        ) : null}
        {result.to.slug && (
          <p className="text-center text-sm">
            <Link href={`/brands/${result.to.slug}`} className="font-medium text-muted underline decoration-line underline-offset-[3px] hover:text-ink">
              See the full {result.to.brand} size chart
            </Link>
          </p>
        )}
        <FitFeedback result={result} gender={gender} category={category} />
      </div>

      <p className="bg-soft px-5 py-3 text-center text-xs text-muted sm:px-8">Sizes are a guide. Fit varies by item and style.</p>
    </section>
  );
}

const FIT_OPTIONS: { value: FitResult; label: string }[] = [
  { value: "too_small", label: "Too small" },
  { value: "perfect", label: "Perfect" },
  { value: "too_big", label: "Too big" },
];

function FitFeedback({ result, gender, category }: { result: ConvertResponse; gender: Gender; category: Category }) {
  const [sent, setSent] = useState<FitResult | null>(null);
  const [failed, setFailed] = useState(false);

  async function send(fit: FitResult) {
    setSent(fit);
    setFailed(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_brand: result.from.brand,
          from_size: result.from.size,
          to_brand: result.to.brand,
          recommended_size: sizeText(result.recommended),
          gender,
          category,
          fit_result: fit,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSent(null);
      setFailed(true);
    }
  }

  return (
    <div role="group" aria-labelledby="fit-q">
      <p id="fit-q" className="text-center text-[15px] font-semibold">
        Did this fit?
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {FIT_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={sent === o.value}
            aria-disabled={sent !== null && sent !== o.value}
            onClick={() => sent === null && send(o.value)}
            className={`min-h-11 rounded-xl border text-[14px] font-medium transition-colors duration-150 ${
              sent === o.value
                ? "cursor-default border-ink bg-ink text-white"
                : sent
                  ? "cursor-default border-line bg-white text-faint"
                  : "cursor-pointer border-line bg-white text-ink hover:border-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-center text-[13px] text-muted">
        {sent && "Thanks — this helps us improve recommendations."}
        {failed && <span className="text-danger">Couldn&rsquo;t save that. Please try again.</span>}
      </p>
    </div>
  );
}
