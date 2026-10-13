/** Text wordmark: "RATE MY" in white, "GRID" in the accent green. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-[22px] font-extrabold uppercase leading-none tracking-[0.03em] whitespace-nowrap sm:text-2xl ${className}`}
    >
      Rate My <span className="text-accent">Grid</span>
    </span>
  );
}
