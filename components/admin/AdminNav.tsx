"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/import", label: "CSV import" },
  { href: "/admin/sizes", label: "Size chart" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/requests", label: "Brand requests" },
  { href: "/admin/feedback", label: "Fit feedback" },
];

export function AdminNav() {
  const path = usePathname();
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
      <nav aria-label="Admin" className="-mx-1 flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const active = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-sm font-medium transition-colors ${
                active ? "bg-ink text-white" : "text-muted hover:bg-soft hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" });
          router.replace("/admin/login");
          router.refresh();
        }}
        className="min-h-10 cursor-pointer rounded-full px-3 text-sm text-muted hover:text-ink"
      >
        Sign out
      </button>
    </div>
  );
}
