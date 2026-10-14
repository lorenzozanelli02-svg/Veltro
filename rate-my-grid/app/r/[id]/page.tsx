import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/Eyebrow";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { FreeFixes } from "@/components/report/FreeFixes";
import { FullReportView } from "@/components/report/FullReportView";
import { LockedReport } from "@/components/report/LockedReport";
import { SaveLink } from "@/components/report/SaveLink";
import { ShareButton } from "@/components/report/ShareButton";
import { CategoryBars } from "@/components/score/CategoryBars";
import { ScoreRing } from "@/components/score/ScoreRing";
import { goalById } from "@/lib/goals";
import { isReportId } from "@/lib/ids";
import { toPublicReport } from "@/lib/report";
import { getReport } from "@/lib/store";

export const metadata: Metadata = {
  title: "Your Instagram score",
  robots: { index: false, follow: false },
};

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ unlocked?: string }>;
}) {
  const { id } = await params;
  const { unlocked } = await searchParams;
  if (!isReportId(id)) notFound();
  const stored = await getReport(id);
  if (!stored) notFound();

  // Only this object reaches the browser: the paid sections are left out until the report is paid for.
  const report = toPublicReport(stored);
  const goalLabel = goalById(report.goal).label;

  return (
    <>
      <Header
        nav={false}
        action={
          <Link href="/?step=goal" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
            Score another
          </Link>
        }
      />
      <main className="relative isolate flex-1">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(70%_55%_at_50%_0%,rgb(221_42_123/0.15),transparent_72%)]" />
        <div className="mx-auto max-w-3xl px-4 pt-24 pb-24 sm:px-6 sm:pt-28 lg:max-w-7xl lg:px-8 lg:pt-32">
          {report.demo && (
            <p className="mb-8 rounded-2xl border border-warn/40 bg-warn/8 px-4 py-3 text-sm leading-relaxed text-warn">
              Demo report: the AI isn&rsquo;t connected yet, so the scores and advice are placeholders, not a real verdict on this account.
            </p>
          )}
          {report.paid && unlocked && (
            <p role="status" className="mb-8 rounded-2xl border border-accent/40 bg-accent/8 px-4 py-3 text-[15px] leading-relaxed text-accent">
              Unlocked. Your full report is below, and this link is yours to keep.
            </p>
          )}

          {/* Computer: the score on the left and the breakdown beside it. */}
          <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-16 xl:gap-24">
            <section aria-labelledby="score-title" className="text-center sm:text-left lg:sticky lg:top-10">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <Eyebrow>Your Instagram score</Eyebrow>
                <span className="rounded-full bg-raised px-3 py-1 text-xs font-semibold text-muted ring-1 ring-line">Goal: {goalLabel}</span>
              </div>
              {report.source?.kind === "profile" ? (
                <p className="mt-5 inline-flex max-w-full items-center gap-2.5 rounded-full bg-raised py-1.5 pr-4 pl-1.5 text-left ring-1 ring-line">
                  {report.source.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small data URL saved with the report
                    <img src={report.source.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="size-8 shrink-0 rounded-full bg-line" />
                  )}
                  <span className="min-w-0 truncate text-sm">
                    <span className="font-semibold">@{report.source.username}</span>
                    <span className="text-muted">
                      {report.source.followers !== null && ` · ${report.source.followers.toLocaleString("en-GB")} followers`}
                      <span className="hidden sm:inline">{` · ${report.source.postsAnalysed} posts analysed`}</span>
                    </span>
                  </span>
                </p>
              ) : report.source?.kind === "screenshots" ? (
                <p className="mt-4 text-sm text-muted">Scored from your {report.source.count} screenshots</p>
              ) : null}
              <div className="mt-8 flex flex-col items-center gap-8 sm:flex-row sm:gap-10 lg:flex-col lg:items-start">
                <ScoreRing score={report.score} className="w-56 shrink-0 sm:w-60 lg:w-72" />
                <div>
                  <h1 id="score-title" className="font-display text-[2.6rem] leading-[0.92] font-extrabold uppercase text-balance sm:text-5xl">
                    &ldquo;{report.verdict}&rdquo;
                  </h1>
                  <div className="mt-6 flex justify-center sm:justify-start">
                    <ShareButton data={{ score: report.score, verdict: report.verdict, categories: report.categories, goalLabel }} />
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="cat-title" className="mt-16 lg:mt-0">
              <Eyebrow>Breakdown</Eyebrow>
              <h2 id="cat-title" className="mt-3 font-display text-4xl leading-[0.95] font-extrabold uppercase sm:text-5xl">
                Where you <span className="text-ig">lose points</span>
              </h2>
              <div className="mt-6 rounded-2xl border border-line bg-surface/80 p-5 sm:p-6">
                <CategoryBars categories={report.categories} notes />
              </div>
            </section>
          </div>

          <section aria-labelledby="fix-title" className="mt-16 lg:mt-24">
            <Eyebrow>Free fixes</Eyebrow>
            <h2 id="fix-title" className="mt-3 font-display text-4xl leading-[0.95] font-extrabold uppercase sm:text-5xl">
              Fix these <span className="text-ig">first</span>
            </h2>
            <div className="mt-6">
              <FreeFixes fixes={report.freeFixes} />
            </div>
          </section>

          <div id="full-report" className="mt-20 scroll-mt-8 lg:mt-28">
            {report.full ? <FullReportView full={report.full} /> : <LockedReport id={report.id} />}
          </div>

          <div className="mt-16">
            <SaveLink id={report.id} paid={report.paid} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
