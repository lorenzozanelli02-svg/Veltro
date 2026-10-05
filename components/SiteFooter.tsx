import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", label: "Size converter" },
  { href: "/brands", label: "Brand size guides" },
  { href: "/brand-request", label: "Request a brand" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-muted">{SITE.tagline}. Sizes are a guide; fit varies by item and style.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-10 items-center text-sm text-muted transition-colors hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto w-full max-w-5xl px-4 pb-8 text-xs text-faint sm:px-6">
        © {new Date().getFullYear()} {SITE.name}
      </p>
    </footer>
  );
}
