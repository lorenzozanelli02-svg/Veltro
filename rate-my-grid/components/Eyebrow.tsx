/** Small monospaced label above a heading, as in the Digital Serenity style. */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-mono text-xs font-normal tracking-[0.2em] text-soft/90 uppercase sm:text-[13px] ${className}`}>{children}</p>;
}
