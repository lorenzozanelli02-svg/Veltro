import { SITE } from "@/lib/site";

/** Wordmark: the name set in the display serif, finished with an accent full stop. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-[28px] leading-none tracking-[-0.01em] text-ink ${className}`}>
      {SITE.name.toLowerCase()}
      <span className="text-accent">.</span>
    </span>
  );
}
