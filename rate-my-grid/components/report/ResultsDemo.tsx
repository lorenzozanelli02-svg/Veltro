import Link from "next/link";
import type { DemoView } from "@/lib/demo";
import type { PublicReport } from "@/lib/report";
import { cn } from "@/lib/utils";
import { ResultsShowcase } from "./ResultsShowcase";

/** The results page on demo data, with switches for the visual (username or screenshots) and locked or unlocked. */
export function ResultsDemo({ report, view, paid, screenshot }: { report: PublicReport; view: DemoView; paid: boolean; screenshot: string }) {
  const href = (next: { view?: DemoView; paid?: boolean }) => {
    const q = new URLSearchParams({ view: next.view ?? view });
    if (next.paid ?? paid) q.set("paid", "1");
    return `/demo/results?${q}`;
  };
  const chip = (active: boolean) =>
    cn(
      "rounded-full px-2.5 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors sm:px-3 sm:text-[11px] sm:tracking-[0.14em]",
      active ? "bg-slate-200 text-slate-950" : "text-soft hover:text-ink",
    );

  return (
    <>
      <nav aria-label="Demo views" className="glass mx-auto mb-12 flex w-fit flex-wrap items-center justify-center gap-1 rounded-full p-1 lg:mb-6">
        <Link href={href({ view: "profile" })} className={chip(view === "profile")} scroll={false}>
          Username
        </Link>
        <Link href={href({ view: "screenshots" })} className={chip(view === "screenshots")} scroll={false}>
          Screenshots
        </Link>
        <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-slate-400/25 sm:mx-1" />
        <Link href={href({ paid: false })} className={chip(!paid)} scroll={false}>
          Locked
        </Link>
        <Link href={href({ paid: true })} className={chip(paid)} scroll={false}>
          Unlocked
        </Link>
      </nav>
      <ResultsShowcase
        key={`${view}-${paid}`}
        report={report}
        justUnlocked={paid}
        screenshot={view === "screenshots" ? screenshot : undefined}
        unlockHref={href({ paid: true })}
      />
    </>
  );
}
