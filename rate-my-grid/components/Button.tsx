import Link from "next/link";

type Size = "sm" | "lg";
type Variant = "primary" | "secondary";

const SIZES: Record<Size, string> = {
  sm: "min-h-10 px-5 text-sm",
  lg: "min-h-13 px-7 text-base",
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ig text-white shadow-[0_0_36px_-8px_var(--color-ig-pink)] hover:brightness-110 disabled:bg-none disabled:bg-line disabled:text-muted disabled:shadow-none",
  secondary: "glass text-ink hover:border-slate-300/40 hover:bg-slate-800/60 disabled:text-muted",
};

/** Pill button: the Instagram gradient for the main action, frosted slate for the rest. For links and buttons. */
export function buttonClass({ size = "lg", variant = "primary", className = "" }: { size?: Size; variant?: Variant; className?: string } = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-[color,background-color,border-color,filter] disabled:cursor-not-allowed ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
}

export function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M4 10h11M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ButtonLink({
  href,
  children,
  size,
  variant,
  className,
  arrow = true,
}: {
  href: string;
  children: React.ReactNode;
  size?: Size;
  variant?: Variant;
  className?: string;
  arrow?: boolean;
}) {
  return (
    <Link href={href} className={buttonClass({ size, variant, className })}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}
