import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
      <Link href="/" aria-label="Home" className="-mx-1 rounded-lg px-1 py-2">
        <Logo />
      </Link>
      <nav aria-label="Main">
        <Link
          href="/brands"
          className="inline-flex min-h-11 items-center rounded-full px-3 text-[15px] font-medium text-muted transition-colors hover:bg-soft hover:text-ink"
        >
          Brands
        </Link>
      </nav>
    </header>
  );
}
