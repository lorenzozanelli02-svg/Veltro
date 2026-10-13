export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.22em] text-accent sm:text-[13px] ${className}`}>{children}</p>
  );
}
