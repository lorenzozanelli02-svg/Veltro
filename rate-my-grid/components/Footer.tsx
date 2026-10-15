import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <Logo className="text-lg sm:text-xl" />
        <div className="space-y-1 text-sm text-muted sm:text-right">
          <p>
            &copy; {new Date().getFullYear()} Rate My Grid &middot;{" "}
            <Link href="/privacy" className="underline-offset-4 hover:text-accent hover:underline">
              Privacy
            </Link>
          </p>
          <p className="text-xs">Not affiliated with Instagram or Meta.</p>
        </div>
      </div>
    </footer>
  );
}
