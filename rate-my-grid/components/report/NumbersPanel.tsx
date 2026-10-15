import type { Report } from "@/lib/report";

// The facts shown as tiles, in this order. The rest are only used as evidence.
const TILES = ["engagement_rate", "posts_per_week", "longest_gap", "avg_likes", "avg_comments", "format_mix", "captions_with_cta"];

const POSITION = {
  below: { text: "Below typical", tone: "text-bad" },
  within: { text: "Typical", tone: "text-warn" },
  above: { text: "Above typical", tone: "text-accent" },
} as const;

/** Where their engagement rate sits on a scale from 0 to a bit past the top of the typical range. */
function BenchmarkBar({ benchmark }: { benchmark: NonNullable<Report["benchmark"]> }) {
  const top = Math.max(benchmark.high * 1.6, benchmark.rate * 1.1);
  const at = (value: number) => `${Math.min((value / top) * 100, 100)}%`;
  const position = POSITION[benchmark.position];
  return (
    <div className="mt-4">
      <div className="relative h-2 rounded-full bg-line" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-full bg-muted/35" style={{ left: at(benchmark.low), width: `calc(${at(benchmark.high)} - ${at(benchmark.low)})` }} />
        <div className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ig ring-2 ring-surface" style={{ left: at(benchmark.rate) }} />
      </div>
      <p className="mt-2.5 text-sm leading-snug text-muted">
        <span className={`font-semibold ${position.tone}`}>{position.text}</span> for accounts with {benchmark.range}: usually {benchmark.low}% to{" "}
        {benchmark.high}%.
      </p>
    </div>
  );
}

/** The account's numbers, all worked out on our server from their recent posts (username lookups only). */
export function NumbersPanel({ facts, benchmark }: { facts: Report["facts"]; benchmark: Report["benchmark"] }) {
  const tiles = TILES.map((id) => facts.find((f) => f.id === id)).filter((f) => f !== undefined);
  if (!tiles.length) return null;
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((fact) => (
        <div
          key={fact.id}
          className={`rounded-2xl border border-line bg-surface/80 p-4 sm:p-5 ${fact.id === "engagement_rate" && benchmark ? "sm:col-span-2" : ""}`}
        >
          <dt className="text-sm font-semibold text-muted">{fact.label}</dt>
          <dd className="mt-1.5 font-display text-3xl leading-none font-bold tabular-nums">{fact.value}</dd>
          {fact.id === "engagement_rate" && benchmark ? (
            <BenchmarkBar benchmark={benchmark} />
          ) : (
            fact.note && <p className="mt-2 text-sm leading-snug text-muted">{fact.note}</p>
          )}
        </div>
      ))}
    </dl>
  );
}
