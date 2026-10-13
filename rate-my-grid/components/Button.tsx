import Link from "next/link";

type Size = "sm" | "lg";
type Variant = "primary" | "secondary";

const SIZES: Record<Size, string> = {
  sm: "min-h-10 px-5 text-sm",
  lg: "min-h-13 px-7 text-base",
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent shadow-[0_0_36px_-8px_var(--color-accent)] hover:bg-accent-hover disabled:bg-line disabled:text-muted disabled:shadow-none",
  secondary: "border border-line bg-surface text-ink hover:border-accent/50 hover:text-accent disabled:text-muted",
};

/** Same pill as the Get Seen Get Signed buy button, for both links and buttons. */
export function buttonClass({ size = "lg", variant = "primary", className = "" }: { size?: Size; variant?: Variant; className?: string } = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
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
