import Link from "next/link";
import { ButtonLink } from "./Button";
import { Logo } from "./Logo";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#what-you-get", label: "What you get" },
];

/** Sits on top of the page's first section. */
export function Header({ nav = true, action }: { nav?: boolean; action?: React.ReactNode }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Rate My Grid, home">
          <Logo />
        </Link>
        {nav && (
          <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="font-mono text-xs tracking-[0.18em] text-soft/90 uppercase transition-colors hover:text-ink">
                {item.label}
              </a>
            ))}
            <ButtonLink href="/?step=goal" size="sm">
              Get my score
            </ButtonLink>
          </nav>
        )}
        {action}
      </div>
    </header>
  );
}
