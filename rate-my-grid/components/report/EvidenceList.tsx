import type { Evidence } from "@/lib/report";

/** What a piece of feedback is based on: their bio, a post, a number or a screenshot. */
export function EvidenceList({ evidence, className = "" }: { evidence: Evidence[]; className?: string }) {
  if (!evidence.length) return null;
  return (
    <ul className={`space-y-1 ${className}`} aria-label="Based on">
      {evidence.map((e, i) => (
        <li key={i} className="flex gap-2 text-sm leading-snug text-muted">
          <span aria-hidden="true" className="mt-[0.45em] size-1 shrink-0 rounded-full bg-accent/70" />
          <span>
            <span className="font-semibold text-ink/80">{e.label}:</span> <span className="break-words whitespace-pre-line">{e.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
