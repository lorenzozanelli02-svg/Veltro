import Link from "next/link";
import { Logo } from "./Logo";

const NAV = [
  { href: "/#how", label: "How it works", desktopOnly: true },
  { href: "/brands", label: "Brands", desktopOnly: false },
  { href: "/brand-request", label: "Request a brand", desktopOnly: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Home" className="-mx-1 rounded-lg px-1 py-2">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`min-h-11 items-center rounded-full px-3 text-[15px] font-medium text-muted transition-colors duration-200 hover:bg-soft hover:text-ink ${
                l.desktopOnly ? "hidden sm:inline-flex" : "inline-flex"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
