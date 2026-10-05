import Link from "next/link";
import { SITE } from "@/lib/site";

const LINKS = [
  { href: "/", label: "Size converter" },
  { href: "/brands", label: "Brand size guides" },
  { href: "/brand-request", label: "Request a brand" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-12 sm:grid-cols-[1fr_auto] sm:px-6">
        <div className="max-w-sm">
          <p className="font-display text-3xl leading-tight tracking-[-0.01em]">
            {SITE.tagline}<span className="text-accent">.</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Official size charts, compared in centimetres. Sizes are a guide; fit varies by item and style.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-1 sm:grid-cols-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-10 items-center text-sm text-muted transition-colors duration-200 hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto w-full max-w-6xl overflow-hidden px-4 sm:px-6">
        <p
          aria-hidden="true"
          className="select-none pt-8 font-display text-[29vw] leading-[0.8] tracking-[-0.03em] text-ink sm:text-[17rem]"
        >
          {SITE.name.toLowerCase()}
          <span className="text-accent">.</span>
        </p>
      </div>
      <div className="ruler h-3 text-line" aria-hidden="true" />
      <p className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-faint sm:px-6">
        © {new Date().getFullYear()} {SITE.name} · No sign-up needed.
      </p>
    </footer>
  );
}
