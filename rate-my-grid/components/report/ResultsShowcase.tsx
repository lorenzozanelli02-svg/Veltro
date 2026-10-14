"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CircleCheck,
  Images,
  LayoutGrid,
  MousePointerClick,
  Target,
  ThumbsUp,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  ANIMATIONS,
  FlipLayout,
  IslandTabs,
  MetricBars,
  OrbitFrame,
  SideGlow,
  StatusPill,
  type Metric,
  type TabOption,
} from "@/components/ui/spatial-product-showcase";
import { goalById } from "@/lib/goals";
import { CATEGORIES, scoreBand, type CategoryKey, type PublicReport, type ReportSource, type ScoreBand } from "@/lib/report";
import { FullReportView } from "./FullReportView";
import { LockedReport } from "./LockedReport";
import { SaveLink } from "./SaveLink";
import { ShareButton } from "./ShareButton";

type Tab = "working" | "fix";

const TABS: TabOption<Tab>[] = [
  {
    id: "working",
    label: "What’s working",
    icon: ThumbsUp,
    surfaceClass: "bg-linear-to-b from-emerald-600/70 to-emerald-900/80 ring-1 ring-emerald-400/40",
    activeTextClass: "text-emerald-100",
    dotClass: "bg-good",
  },
  {
    id: "fix",
    label: "What to fix",
    icon: Wrench,
    surfaceClass: "bg-linear-to-b from-amber-600/70 to-rose-900/80 ring-1 ring-amber-400/40",
    activeTextClass: "text-amber-50",
    dotClass: "bg-warn",
  },
];

/** Each tab's colours: the glow behind the frame and the light from the side. */
const TAB_LOOK: Record<Tab, { glow: string; side: string }> = {
  working: { glow: "from-emerald-400 via-teal-400 to-cyan-500", side: "rgba(52, 211, 153, 0.13)" },
  fix: { glow: "from-ig-orange via-bad to-ig-pink", side: "rgba(245, 133, 41, 0.13)" },
};

const BAND: Record<ScoreBand, { bar: string; text: string; dot: string }> = {
  strong: { bar: "bg-linear-to-r from-emerald-600 to-good", text: "text-good", dot: "bg-good" },
  okay: { bar: "bg-linear-to-r from-ig-orange to-warn", text: "text-warn", dot: "bg-warn" },
  weak: { bar: "bg-linear-to-r from-rose-600 to-bad", text: "text-bad", dot: "bg-bad" },
};

const CATEGORY_ICONS: Record<CategoryKey, LucideIcon> = {
  bio: UserRound,
  content: LayoutGrid,
  consistency: CalendarDays,
  callToAction: MousePointerClick,
  goalFit: Target,
};

/** Which categories each tab is about: 60 and up is working, below 60 needs fixing (at least one each way). */
function relevant(categories: PublicReport["categories"], tab: Tab): Set<CategoryKey> {
  const scored = CATEGORIES.map(({ key }) => ({ key, score: categories[key].score })).sort((a, b) => a.score - b.score);
  const picked = scored.filter(({ score }) => (tab === "fix" ? score < 60 : score >= 60)).map(({ key }) => key);
  if (picked.length) return new Set(picked);
  return new Set([tab === "fix" ? scored[0].key : scored[scored.length - 1].key]);
}

type ProfileSource = Extract<ReportSource, { kind: "profile" }>;

const count = (n: number) => n.toLocaleString("en-GB");

/**
 * A small version of their Instagram profile, sized to sit inside the round frame: profile picture,
 * username, followers, bio and the latest nine posts. Everything scales with the frame (cqw units).
 */
function ProfileCard({ source }: { source: ProfileSource }) {
  const thumbs = (source.thumbnails ?? []).slice(0, 9);
  return (
    <div role="img" aria-label={`Preview of @${source.username}'s Instagram profile`} className="absolute inset-0">
      {thumbs[0] && (
        // eslint-disable-next-line @next/next/no-img-element -- their own post, a small data URL saved with the report
        <img src={thumbs[0]} alt="" className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl" />
      )}
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="absolute top-1/2 left-1/2 w-[58cqw] -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center gap-[2.5cqw]">
          <span className="shrink-0 rounded-full bg-ig p-[0.55cqw]">
            {source.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- their own profile picture, a small data URL
              <img src={source.avatar} alt="" className="block size-[11cqw] rounded-full border-[0.6cqw] border-slate-950 object-cover" />
            ) : (
              <span className="block size-[11cqw] rounded-full border-[0.6cqw] border-slate-950 bg-slate-800" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[3.7cqw] leading-tight font-medium text-slate-50">@{source.username}</p>
            {source.followers !== null && (
              <p className="mt-[0.6cqw] font-mono text-[2.5cqw] tracking-[0.12em] text-soft uppercase">{count(source.followers)} followers</p>
            )}
          </div>
        </div>
        {source.bio && <p className="mt-[2.4cqw] line-clamp-2 text-[2.8cqw] leading-[1.35] whitespace-pre-line text-soft">{source.bio}</p>}
        <div className="mx-auto mt-[2.6cqw] grid w-[52cqw] grid-cols-3 gap-[0.6cqw]">
          {Array.from({ length: 9 }, (_, i) =>
            thumbs[i] ? (
              // eslint-disable-next-line @next/next/no-img-element -- their own post thumbnail
              <img key={i} src={thumbs[i]} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <span key={i} className="aspect-square w-full bg-slate-800/70" />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

/** Their uploaded profile screenshot. It only ever lives in this browser (see ScoreFlow), never on our servers. */
function ScreenshotVisual({ image, count: shots }: { image: string | null; count: number }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- their own screenshot, kept in this browser only
    // Starts a little below the top, past the phone's status bar.
    return <img src={image} alt="Your profile screenshot" className="size-full object-cover object-[50%_8%]" />;
  }
  return (
    <div className="flex flex-col items-center gap-3 px-10 text-center">
      <Images aria-hidden="true" className="size-10 text-soft/70" strokeWidth={1.25} />
      <p className="font-mono text-xs tracking-[0.16em] text-soft uppercase">Scored from your {shots} screenshots</p>
    </div>
  );
}

/** The browser-only copy of the first screenshot, if this is the browser that uploaded it. */
function useSavedScreenshot(id: string, enabled: boolean) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    try {
      setImage(sessionStorage.getItem(`rmg-shot-${id}`));
    } catch {}
  }, [id, enabled]);
  return image;
}

function Fixes({ fixes }: { fixes: PublicReport["freeFixes"] }) {
  return (
    <ol className="space-y-4">
      {fixes.map((fix, i) => (
        <motion.li key={fix.title} variants={ANIMATIONS.item} className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs tracking-[0.2em] text-warn tabular-nums">0{i + 1}</span>
            <span aria-hidden="true" className="h-px flex-1 bg-linear-to-r from-warn/40 to-transparent" />
          </div>
          <h3 className="mt-3 text-lg leading-snug font-medium text-slate-50">{fix.title}</h3>
          <dl className="mt-4 space-y-3 text-[15px] leading-relaxed">
            <div>
              <dt className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">What we saw</dt>
              <dd className="mt-1 text-soft">{fix.problem}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.18em] text-warn uppercase">Do this</dt>
              <dd className="mt-1 text-ink">{fix.fix}</dd>
            </div>
          </dl>
        </motion.li>
      ))}
    </ol>
  );
}

function Strengths({ strengths }: { strengths: PublicReport["strengths"] }) {
  return (
    <ul className="space-y-4">
      {strengths.map((s) => (
        <motion.li key={s.title} variants={ANIMATIONS.item} className="glass flex gap-4 rounded-2xl p-5 sm:p-6">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-good" strokeWidth={1.75} />
          <div>
            <h3 className="text-lg leading-snug font-medium text-slate-50">{s.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-soft">{s.detail}</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

/**
 * The results page in the "Spatial Product Showcase" layout. Left (top on a phone): their Instagram in
 * the round frame with the score under it. Right: the verdict, summary, scores, then what to fix or
 * what's working (the tabs at the bottom switch between them and flip the layout), then the paid
 * report, locked or unlocked.
 */
export function ResultsShowcase({
  report,
  justUnlocked = false,
  screenshot,
  unlockHref,
}: {
  report: PublicReport;
  /** Just back from checkout: say so at the top. */
  justUnlocked?: boolean;
  /** The screenshot to show; when left out, it's read from this browser's session (real reports). */
  screenshot?: string | null;
  /** Demo only: where the unlock button goes instead of checkout. */
  unlockHref?: string;
}) {
  const [tab, setTab] = useState<Tab>("fix");
  const panelId = useId();
  const tabBlock = useRef<HTMLDivElement>(null);
  const source = report.source;
  const saved = useSavedScreenshot(report.id, source?.kind === "screenshots" && screenshot === undefined);
  const band = BAND[scoreBand(report.score)];
  const goalLabel = goalById(report.goal).label;
  const focus = relevant(report.categories, tab);

  const metrics: Metric[] = CATEGORIES.map(({ key, label }) => {
    const { score, note } = report.categories[key];
    const b = BAND[scoreBand(score)];
    return {
      key,
      label,
      value: score,
      icon: CATEGORY_ICONS[key],
      barClass: b.bar,
      valueClass: b.text,
      emphasis: focus.has(key),
      note: focus.has(key) ? note : undefined,
    };
  });

  // If the part that changes is off screen (they've scrolled down to the full report), bring it into view.
  // The scroll waits until the change has rendered: started in the click itself, the re-render cancels it.
  const scrollOnChange = useRef(false);
  useEffect(() => {
    if (!scrollOnChange.current) return;
    scrollOnChange.current = false;
    const frame = requestAnimationFrame(() => tabBlock.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [tab]);

  function changeTab(next: Tab) {
    const top = tabBlock.current?.getBoundingClientRect().top ?? 0;
    scrollOnChange.current = top < 0 || top > window.innerHeight * 0.75;
    setTab(next);
  }

  const visual = (
    <>
      <OrbitFrame
        size="lg"
        glow={TAB_LOOK[tab].glow}
        pill={
          <StatusPill dot={band.dot}>
            Score <span className={`text-sm font-medium ${band.text}`}>{report.score}</span> / 100
          </StatusPill>
        }
      >
        {source?.kind === "profile" ? (
          <ProfileCard source={source} />
        ) : (
          <ScreenshotVisual image={screenshot === undefined ? saved : screenshot} count={source?.kind === "screenshots" ? source.count : 0} />
        )}
      </OrbitFrame>
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        {source?.kind === "profile" && (
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">
            {source.postsAnalysed} posts analysed · {source.postsLast30Days} in 30 days
          </p>
        )}
        <ShareButton data={{ score: report.score, verdict: report.verdict, categories: report.categories, goalLabel }} />
      </div>
    </>
  );

  return (
    <>
      <SideGlow side={tab === "fix" ? "left" : "right"} color={TAB_LOOK[tab].side} />
      <FlipLayout flipped={tab === "working"} visual={visual}>
        <motion.div variants={ANIMATIONS.container} initial="hidden" animate="visible">
          {report.demo && (
            <motion.p variants={ANIMATIONS.item} className="mb-8 rounded-2xl border border-warn/40 bg-warn/8 px-4 py-3 text-sm leading-relaxed text-warn">
              Demo report: the AI isn&rsquo;t connected yet, so the scores and advice are placeholders, not a real verdict on this account.
            </motion.p>
          )}
          {report.paid && justUnlocked && (
            <motion.p
              variants={ANIMATIONS.item}
              role="status"
              className="mb-8 rounded-2xl border border-good/40 bg-good/8 px-4 py-3 text-[15px] leading-relaxed text-emerald-200"
            >
              Unlocked. Your full report is below, and this link is yours to keep.
            </motion.p>
          )}

          <motion.p variants={ANIMATIONS.item} className="font-mono text-xs tracking-[0.2em] text-soft/90 uppercase sm:text-[13px]">
            Goal · {goalLabel}
          </motion.p>
          <motion.h1
            variants={ANIMATIONS.item}
            id="score-title"
            className="mt-4 bg-linear-to-b from-white to-white/65 bg-clip-text text-4xl leading-[1.1] font-light tracking-tight text-balance text-transparent sm:text-5xl"
          >
            &ldquo;{report.verdict}&rdquo;
          </motion.h1>
          <motion.p variants={ANIMATIONS.item} className="mt-5 text-base leading-relaxed text-soft sm:text-lg">
            {report.summary}
          </motion.p>

          <motion.div variants={ANIMATIONS.item} className="glass mt-9 rounded-2xl p-5 sm:p-6">
            <p className="mb-5 font-mono text-xs tracking-[0.2em] text-muted uppercase">Your scores</p>
            <MetricBars metrics={metrics} />
          </motion.div>

          <div ref={tabBlock} id={panelId} role="tabpanel" aria-label={tab === "fix" ? "What to fix" : "What's working"} className="mt-12 scroll-mt-24">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tab} variants={ANIMATIONS.container} initial="hidden" animate="visible" exit="exit">
                <motion.div variants={ANIMATIONS.item} className="mb-5 flex items-baseline justify-between gap-4">
                  <h2 className="text-2xl font-light tracking-tight text-slate-50 sm:text-3xl">
                    {tab === "fix" ? (
                      <>
                        Fix these <span className="text-warn">first</span>
                      </>
                    ) : (
                      <>
                        Keep <span className="text-good">doing this</span>
                      </>
                    )}
                  </h2>
                  <span className="font-mono text-xs tracking-[0.18em] text-muted uppercase">Free</span>
                </motion.div>
                {tab === "fix" ? <Fixes fixes={report.freeFixes} /> : <Strengths strengths={report.strengths} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div id="full-report" className="mt-16 scroll-mt-24">
            {report.full ? <FullReportView full={report.full} /> : <LockedReport id={report.id} unlockHref={unlockHref} />}
          </div>

          <div className="mt-14">
            <SaveLink id={report.id} paid={report.paid} />
          </div>
        </motion.div>
      </FlipLayout>
      <IslandTabs options={TABS} active={tab} onChange={changeTab} label="Feedback" controls={panelId} />
    </>
  );
}
