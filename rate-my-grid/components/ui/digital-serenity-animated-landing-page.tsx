"use client";

/**
 * "Digital Serenity" from 21st.dev, adapted for Rate My Grid and typed.
 *
 * What changed from the original:
 * - The inline <style> block lives in app/globals.css, so it works before the JavaScript loads.
 * - Words are timed with CSS animation-delay instead of setTimeout + querySelectorAll, so React owns the DOM.
 * - The mouse glow and click ripples only run on computers with a real mouse (never on phones or
 *   tablets) and not at all when someone has asked for reduced motion.
 * - The floating dots drift straight away instead of waiting for a scroll.
 * - The pieces are separate so the same backdrop and word reveal carry through the scoring steps.
 */

import { Fragment, useEffect, useId, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** How long one word takes to appear (matches `.word-animate` in globals.css). */
export const WORD_MS = 800;

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/** Splits on ordinary spaces only, so non-breaking spaces ("2\u00a0to\u00a05") keep words together. */
const splitWords = (text?: string) => (text ? text.split(/[^\S\u00a0]+/).filter(Boolean) : []);

const countWords = (text?: string) => splitWords(text).length;

/** When the last word of a reveal has fully appeared, for chaining what comes after it. */
export function revealEnd(text: string, start: number, stagger: number) {
  return start + Math.max(countWords(text) - 1, 0) * stagger + WORD_MS;
}

type WordRevealProps = {
  /** The words to reveal, one after another. */
  text: string;
  /** Words added at the end in the Instagram gradient, e.g. the last word of a headline. */
  accent?: string;
  /** Milliseconds before the first word starts. */
  start?: number;
  /** Milliseconds between words. */
  stagger?: number;
  as?: ElementType;
  id?: string;
  className?: string;
};

/** A line of text whose words rise out of a blur one at a time. */
export function WordReveal({ text, accent, start = 0, stagger = 110, as: Tag = "span", id, className }: WordRevealProps) {
  const words = splitWords(text);
  const accentWords = splitWords(accent);
  const all = [...words.map((word) => ({ word, accent: false })), ...accentWords.map((word) => ({ word, accent: true }))];
  return (
    <Tag id={id} className={className}>
      {all.map(({ word, accent: isAccent }, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className={cn("word-animate", isAccent && "text-ig")} style={delay(start + i * stagger)}>
            {word}
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}

/** Fades a block in the same way as the words, after `at` milliseconds. */
export function FadeIn({ at = 0, className, children }: { at?: number; className?: string; children?: ReactNode }) {
  return (
    <div className={cn("serenity-fade", className)} style={delay(at)}>
      {children}
    </div>
  );
}

/**
 * Holds the word and fade animations inside it until it scrolls into view, so sections further down
 * the page animate when they're seen rather than off-screen on load. Without JavaScript, or with
 * reduced motion, everything simply shows.
 */
export function RevealOnScroll({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return; // already on screen: let it play
    el.dataset.reveal = "wait";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        delete el.dataset.reveal;
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** True only with a real mouse and no reduced-motion preference. Always false on the server and on phones. */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setFine(pointer.matches && !motion.matches);
    update();
    pointer.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      pointer.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);
  return fine;
}

type Ripple = { id: number; x: number; y: number };

/** The soft glow that follows the mouse and the small pulse where it clicks. Computers only. */
function MouseGlow() {
  const fine = useFinePointer();
  const glow = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    if (!fine) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let next = 0;

    // Moves the glow by writing its style directly, so following the mouse never re-renders React.
    const move = (e: PointerEvent) => {
      const el = glow.current;
      if (!el) return;
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.opacity = "1";
    };
    const hide = () => {
      if (glow.current) glow.current.style.opacity = "0";
    };
    const click = (e: MouseEvent) => {
      const ripple = { id: next++, x: e.clientX, y: e.clientY };
      setRipples((list) => [...list, ripple]);
      const timer = setTimeout(() => {
        setRipples((list) => list.filter((r) => r.id !== ripple.id));
        timers.delete(timer);
      }, 1000);
      timers.add(timer);
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("click", click);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("click", click);
      timers.forEach(clearTimeout);
    };
  }, [fine]);

  if (!fine) return null;
  return (
    <>
      <div ref={glow} className="mouse-glow size-80 blur-2xl md:size-96 md:blur-3xl" style={{ opacity: 0 }} />
      {ripples.map((r) => (
        <div key={r.id} className="ripple-effect" style={{ left: r.x, top: r.y }} />
      ))}
    </>
  );
}

const GRID_LINES = [
  { x1: "0", y1: "20%", x2: "100%", y2: "20%", at: 500 },
  { x1: "0", y1: "80%", x2: "100%", y2: "80%", at: 1000 },
  { x1: "20%", y1: "0", x2: "20%", y2: "100%", at: 1500 },
  { x1: "80%", y1: "0", x2: "80%", y2: "100%", at: 2000 },
  { x1: "50%", y1: "0", x2: "50%", y2: "100%", at: 2500, faint: true },
  { x1: "0", y1: "50%", x2: "100%", y2: "50%", at: 3000, faint: true },
];

const DETAIL_DOTS = [
  { cx: "20%", cy: "20%", r: 2, at: 3000 },
  { cx: "80%", cy: "20%", r: 2, at: 3200 },
  { cx: "20%", cy: "80%", r: 2, at: 3400 },
  { cx: "80%", cy: "80%", r: 2, at: 3600 },
  { cx: "50%", cy: "50%", r: 1.5, at: 4000 },
];

const FLOATING_DOTS = [
  { top: "25%", left: "15%", at: 500 },
  { top: "60%", left: "85%", at: 1000 },
  { top: "40%", left: "10%", at: 1500 },
  { top: "75%", left: "90%", at: 2000 },
  { top: "12%", left: "62%", at: 2500 },
  { top: "88%", left: "35%", at: 3000 },
];

/**
 * The slate background: a faint 60px grid, lines that draw themselves across it, pulsing dots where
 * they cross, floating specks and (on computers) the mouse glow. `fixed` keeps it still behind a
 * page that scrolls.
 */
export function SerenityBackdrop({ fixed = false, className }: { fixed?: boolean; className?: string }) {
  // Each backdrop gets its own pattern id: a pattern inside a hidden copy would otherwise blank the grid.
  const pattern = `serenity-grid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div
      aria-hidden="true"
      className={cn(
        fixed ? "fixed" : "absolute",
        "inset-0 -z-10 overflow-hidden bg-linear-to-br from-slate-900 via-black to-slate-800",
        className,
      )}
    >
      <svg className="absolute inset-0 size-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={pattern} width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgb(100 116 139 / 0.1)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pattern})`} />
        {GRID_LINES.map(({ at, faint, ...line }) => (
          <line key={at} {...line} className="grid-line" style={{ ...delay(at), ...(faint ? { opacity: 0.05 } : null) }} />
        ))}
        {DETAIL_DOTS.map(({ at, ...dot }) => (
          <circle key={at} {...dot} className="detail-dot" style={delay(at)} />
        ))}
      </svg>
      {FLOATING_DOTS.map(({ top, left, at }) => (
        <div key={at} className="floating-element-animate" style={{ top, left, ...delay(at) }} />
      ))}
      <MouseGlow />
    </div>
  );
}

/** The four thin corner brackets that frame the first screen. */
export function SerenityCorners({ className }: { className?: string }) {
  const corners = [
    { box: "top-20 left-4 sm:top-24 sm:left-6 md:left-8", dot: "top-0 left-0", at: 4000 },
    { box: "top-20 right-4 sm:top-24 sm:right-6 md:right-8", dot: "top-0 right-0", at: 4200 },
    { box: "bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8", dot: "bottom-0 left-0", at: 4400 },
    { box: "bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8", dot: "bottom-0 right-0", at: 4600 },
  ];
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      {corners.map(({ box, dot, at }) => (
        <div key={at} className={cn("corner-element-animate", box)} style={delay(at)}>
          <div className={cn("absolute size-2 rounded-full bg-slate-300 opacity-30", dot)} />
        </div>
      ))}
    </div>
  );
}

/** Small monospaced label with a fading hairline, the original's top and bottom lines. */
export function MonoLabel({ text, start = 0, stagger = 120, line = "below", className }: {
  text: string;
  start?: number;
  stagger?: number;
  line?: "above" | "below" | "none";
  className?: string;
}) {
  const hairline = (
    <FadeIn at={start + 200}>
      <div className="mx-auto h-px w-12 bg-linear-to-r from-transparent via-slate-300 to-transparent opacity-30 sm:w-16" />
    </FadeIn>
  );
  return (
    <div className={cn("text-center", className)}>
      {line === "above" && <div className="mb-4">{hairline}</div>}
      <WordReveal
        as="p"
        text={text}
        start={start}
        stagger={stagger}
        className="font-mono text-xs font-light tracking-[0.2em] text-slate-300 uppercase opacity-90 sm:text-sm"
      />
      {line === "below" && <div className="mt-4">{hairline}</div>}
    </div>
  );
}

type DigitalSerenityProps = {
  /** Small mono line at the top. */
  eyebrow: string;
  /** The headline; `headingAccent` is added at the end in the Instagram gradient. */
  heading: string;
  headingAccent?: string;
  headingId?: string;
  /** The thinner second line under the headline. */
  subheading: string;
  /** The call to action. It fades in once the subheading is nearly done. */
  action?: ReactNode;
  /** Small mono line at the bottom of the screen. */
  note?: string;
  className?: string;
};

// Timings in ms. The button starts to appear at 1.5s and is fully in by about 2.3s.
const EYEBROW_AT = 200;
const HEADING_AT = 450;
const HEADING_STAGGER = 110;
const SUB_AT = 1150;
const SUB_STAGGER = 45;
const ACTION_AT = 1500;

/** The full first screen: the backdrop is left to the page, so it can stay behind what follows. */
export default function DigitalSerenity({
  eyebrow,
  heading,
  headingAccent,
  headingId,
  subheading,
  action,
  note,
  className,
}: DigitalSerenityProps) {
  const noteAt = Math.max(ACTION_AT + 350, revealEnd(subheading, SUB_AT, SUB_STAGGER) - 400);

  return (
    <section
      aria-labelledby={headingId}
      className={cn("relative flex min-h-dvh flex-col items-center justify-between overflow-hidden px-4 pt-24 pb-10 sm:px-8 sm:pt-28 sm:pb-12 md:px-16 md:pb-16", className)}
    >
      <SerenityCorners />

      <MonoLabel text={eyebrow} start={EYEBROW_AT} />

      <div className="relative mx-auto max-w-5xl py-10 text-center">
        <h1
          id={headingId}
          className="text-decoration-animate text-[2.15rem] leading-[1.12] font-light tracking-tight text-balance text-slate-50 sm:text-5xl sm:font-extralight md:text-6xl lg:text-7xl"
        >
          <WordReveal text={heading} accent={headingAccent} start={HEADING_AT} stagger={HEADING_STAGGER} />
        </h1>
        <WordReveal
          as="p"
          text={subheading}
          start={SUB_AT}
          stagger={SUB_STAGGER}
          className="mx-auto mt-6 block max-w-3xl text-lg leading-relaxed font-light tracking-wide text-pretty text-slate-300 sm:mt-8 sm:text-2xl md:text-[1.75rem]"
        />
        {action && (
          <FadeIn at={ACTION_AT} className="mt-9 sm:mt-12">
            {action}
          </FadeIn>
        )}

        {/* The short side lines either side of the headline. */}
        <FadeIn at={3500} className="absolute top-1/2 -left-8 hidden h-px w-4 bg-slate-300 sm:block" />
        <FadeIn at={3700} className="absolute top-1/2 -right-8 hidden h-px w-4 bg-slate-300 sm:block" />
      </div>

      <div className="text-center">
        {note && <MonoLabel text={note} start={noteAt} stagger={60} line="above" />}
        <FadeIn at={noteAt + 700} className="mt-6 flex justify-center gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="size-1 rounded-full bg-slate-300 opacity-40" />
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
