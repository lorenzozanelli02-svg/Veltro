import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ResultsDemo } from "@/components/report/ResultsDemo";
import { SerenityBackdrop } from "@/components/ui/digital-serenity-animated-landing-page";
import { demoAllowed } from "@/lib/config";
import { demoReport, demoScreenshot } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Results page demo",
  robots: { index: false, follow: false },
};

/**
 * The new results page on mock data, for review before it replaces /r/[id]. Only available where mocks
 * are (locally, or with DEMO_MODE=true).
 */
export default async function ResultsDemoPage({ searchParams }: { searchParams: Promise<{ view?: string; paid?: string }> }) {
  // Read the query first so the page renders on each request and DEMO_MODE is checked then, not at build time.
  const params = await searchParams;
  if (!demoAllowed()) notFound();
  const view = params.view === "screenshots" ? "screenshots" : "profile";
  const paid = params.paid === "1";

  return (
    <>
      <SerenityBackdrop fixed />
      <Header
        nav={false}
        action={
          <Link href="/?step=goal" className="font-mono text-xs tracking-[0.18em] text-soft uppercase underline-offset-4 hover:text-ink">
            Score another
          </Link>
        }
      />
      <main className="flex-1 px-4 pt-24 pb-40 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ResultsDemo report={await demoReport({ view, paid })} view={view} paid={paid} screenshot={demoScreenshot()} />
        </div>
      </main>
      <Footer />
    </>
  );
}
