import Link from "next/link";
import { adminCounts } from "@/lib/data";

export default function AdminHome() {
  const c = adminCounts();
  const cards = [
    { label: "Size chart rows", value: c.rows, href: "/admin/sizes" },
    { label: "Brands with data", value: c.brands, href: "/admin/brands" },
    { label: "Brand requests", value: c.requests, href: "/admin/requests" },
    { label: "Fit feedback", value: c.feedback, href: "/admin/feedback" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((k) => (
          <Link key={k.label} href={k.href} className="rounded-2xl border border-line p-4 transition-colors hover:border-ink">
            <p className="text-sm text-muted">{k.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">{k.value}</p>
          </Link>
        ))}
      </div>
      {c.rows === 0 && (
        <p className="mt-6 rounded-2xl bg-accent-soft p-4 text-[15px] text-accent-hover">
          The size chart is empty. <Link href="/admin/import" className="font-semibold underline">Import a CSV</Link> to get started.
        </p>
      )}
    </div>
  );
}
