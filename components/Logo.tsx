import { SITE } from "@/lib/site";

/** Wordmark: the name in lowercase with a tape-measure tick accent. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
        <rect x="1" y="1" width="20" height="20" rx="6" fill="var(--color-accent)" />
        <path d="M6 15V11M9.33 15V8M12.67 15V11M16 15V8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="text-[19px] font-semibold lowercase tracking-[-0.03em] text-ink">{SITE.name}</span>
    </span>
  );
}
