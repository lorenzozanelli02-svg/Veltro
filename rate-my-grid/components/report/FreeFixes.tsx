import type { Report } from "@/lib/report";

export function FreeFixes({ fixes }: { fixes: Report["freeFixes"] }) {
  return (
    <ol className="grid gap-4">
      {fixes.map((fix, i) => (
        <li key={fix.title} className="rounded-2xl border border-line bg-surface/80 p-5 sm:p-6">
          <span className="font-display text-3xl font-extrabold text-ig tabular-nums">0{i + 1}</span>
          <h3 className="mt-2 text-lg leading-snug font-semibold">{fix.title}</h3>
          <dl className="mt-4 space-y-3 text-[15px] leading-relaxed">
            <div>
              <dt className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">What we saw</dt>
              <dd className="mt-1 text-ink/85">{fix.problem}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">Do this</dt>
              <dd className="mt-1 text-ink">{fix.fix}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}
