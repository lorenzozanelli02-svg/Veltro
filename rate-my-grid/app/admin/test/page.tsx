import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminTester } from "@/components/admin/AdminTester";
import { Header } from "@/components/Header";
import { adminEnabled } from "@/lib/admin";
import { aiMode } from "@/lib/config";

export const metadata: Metadata = {
  title: "Score tester",
  robots: { index: false, follow: false },
};

// Checked on every request, so ADMIN_TOKEN can be set without a rebuild.
export const dynamic = "force-dynamic";

/**
 * Hidden test page (not linked anywhere): score a list of accounts side by side, and run one account
 * three times to see how steady its score is. Needs ADMIN_TOKEN on the live site.
 */
export default function AdminTestPage() {
  if (!adminEnabled()) notFound();
  return (
    <>
      <Header nav={false} />
      <main className="flex-1 px-4 pt-24 pb-20 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-display text-4xl leading-[0.95] font-extrabold uppercase sm:text-5xl">
            Score <span className="text-ig">tester</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            Scores each account exactly as the site does (lookup, data check, analysis and rubric), without saving reports or applying the visitor limits.
          </p>
          <div className="mt-8">
            <AdminTester needsToken={Boolean(process.env.ADMIN_TOKEN)} demo={aiMode() === "mock"} />
          </div>
        </div>
      </main>
    </>
  );
}
