"use client";

/**
 * "Spatial Product Showcase" from 21st.dev, adapted for Rate My Grid.
 *
 * The original shows stock product photos in a circular frame with a rotating dashed ring and a
 * pulsing glow, a details panel with animated feature bars, and a floating left/right switcher that
 * flips the layout. Here:
 * - the frame only ever holds the visitor's own Instagram (their profile picture, a preview of their
 *   profile or their screenshot): there are no stock images;
 * - the switcher is a pair of tabs (any number of options, each with its own colour), and works with
 *   the keyboard;
 * - the battery indicator and "View Specs" button are gone;
 * - everything is typed and split into parts the report page puts together.
 */

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The original's staggered blur-in for the details panel. */
export const ANIMATIONS = {
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  },
  item: {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    // Ends on no filter at all: a leftover blur(0px) would stop frosted panels inside from blurring what's behind.
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 100, damping: 20 }, transitionEnd: { filter: "none" } },
    exit: { opacity: 0, y: -10, filter: "blur(5px)" },
  },
} satisfies Record<string, Variants>;

const FRAME_SIZES = {
  // Small enough on a phone that the ring (which reaches 14% past the frame) never overflows the screen.
  md: "size-56 sm:size-64 md:size-72",
  lg: "size-[17.5rem] sm:size-80 md:size-[26rem]",
} as const;

type OrbitFrameProps = {
  children: ReactNode;
  size?: keyof typeof FRAME_SIZES;
  /** Tailwind gradient stops for the glow behind the frame. */
  glow?: string;
  /** Seconds for one turn of the dashed ring. */
  ringSeconds?: number;
  /** Something pinned under the frame, e.g. a status or score pill. */
  pill?: ReactNode;
  className?: string;
};

/** The circular frame: a dashed ring turning around it, a soft glow pulsing behind it and a gentle float. */
export function OrbitFrame({
  children,
  size = "md",
  glow = "from-ig-orange via-ig-pink to-ig-purple",
  ringSeconds = 20,
  pill,
  className,
}: OrbitFrameProps) {
  const still = useReducedMotion();
  return (
    <motion.div
      layout="position"
      animate={still ? undefined : { y: [-6, 6, -6] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className={cn("relative shrink-0", className)}
    >
      {/* The ring turns inside a still, clipped circle: a rotating box's corners would otherwise widen the page. */}
      <div aria-hidden="true" className="absolute inset-[-14%] overflow-hidden rounded-full">
        <motion.div
          animate={still ? undefined : { rotate: 360 }}
          transition={{ duration: ringSeconds, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-dashed border-white/15"
        />
      </div>
      <motion.div
        aria-hidden="true"
        animate={still ? undefined : { scale: [1, 1.06, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute inset-0 rounded-full bg-linear-to-br opacity-40 blur-2xl", glow)}
      />
      <div
        className={cn(
          // A size container, so what's inside can scale with the frame (cqw units).
          "@container relative flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/30 shadow-2xl backdrop-blur-sm",
          FRAME_SIZES[size],
        )}
      >
        {children}
      </div>
      {pill && <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap">{pill}</div>}
    </motion.div>
  );
}

/** The small frosted pill under the frame, with a pulsing dot. */
export function StatusPill({ children, dot = "bg-ig-pink", className }: { children: ReactNode; dot?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 font-mono text-xs tracking-[0.16em] text-soft uppercase backdrop-blur",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 animate-pulse rounded-full", dot)} />
      {children}
    </div>
  );
}

/** A soft coloured light from the side the frame is on. `color` must be an rgba() string so it can animate. */
export function SideGlow({ side, color }: { side: "left" | "right"; color: string }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      initial={false}
      animate={{ background: `radial-gradient(circle at ${side === "left" ? "0%" : "100%"} 45%, ${color}, rgba(0, 0, 0, 0) 55%)` }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
    />
  );
}

export type Metric = {
  key: string;
  label: string;
  /** 0 to 100. */
  value: number;
  icon: LucideIcon;
  /** Classes for the filled part of the bar, e.g. a gradient. */
  barClass: string;
  /** Classes for the number. */
  valueClass?: string;
  /** Faded when false, so the bars that matter right now stand out. */
  emphasis?: boolean;
  /** Shown under the bar, sliding open and closed. */
  note?: ReactNode;
};

/** The feature bars: an icon and label, the value, and a bar that grows from zero. */
export function MetricBars({ metrics, className }: { metrics: Metric[]; className?: string }) {
  const still = useReducedMotion();
  return (
    <ul className={cn("space-y-5", className)}>
      {metrics.map((m, i) => (
        <motion.li key={m.key} animate={{ opacity: m.emphasis === false ? 0.5 : 1 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between gap-4 text-sm sm:text-[15px]">
            <span className="flex items-center gap-2.5 text-slate-200">
              <m.icon aria-hidden="true" className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
              {m.label}
            </span>
            <span className={cn("font-mono text-sm tabular-nums", m.valueClass)}>
              {m.value}
              <span className="sr-only"> out of 100</span>
            </span>
          </div>
          <div aria-hidden="true" className="relative mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <motion.div
              initial={{ width: still ? `${m.value}%` : 0 }}
              animate={{ width: `${m.value}%` }}
              transition={{ duration: 1, delay: 0.4 + i * 0.15, ease: [0.2, 0.8, 0.2, 1] }}
              className={cn("absolute inset-y-0 left-0 rounded-full", m.barClass)}
            />
          </div>
          <AnimatePresence initial={false}>
            {m.note && (
              <motion.div
                key="note"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-2.5 text-[15px] leading-relaxed text-soft">{m.note}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.li>
      ))}
    </ul>
  );
}

export type TabOption<T extends string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Classes for the sliding surface behind the active tab. */
  surfaceClass: string;
  /** Classes for the active tab's text. */
  activeTextClass: string;
  /** Classes for the small dot under the active tab. */
  dotClass: string;
};

/**
 * The floating "island" switcher, pinned to the bottom of the screen. The surface behind the active
 * tab slides between them. Arrow keys move between tabs, as with any tab list.
 */
export function IslandTabs<T extends string>({
  options,
  active,
  onChange,
  label,
  controls,
}: {
  options: TabOption<T>[];
  active: T;
  onChange: (id: T) => void;
  label: string;
  /** The id of the panel these tabs change. */
  controls: string;
}) {
  const group = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].id);
    buttons.current[next]?.focus();
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-8">
      <motion.div
        layout
        role="tablist"
        aria-label={label}
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/90 p-1.5 shadow-2xl ring-1 shadow-black/60 ring-white/5 backdrop-blur-2xl"
      >
        {options.map((opt, i) => {
          const selected = opt.id === active;
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.id}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${group}-${opt.id}`}
              aria-selected={selected}
              aria-controls={controls}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(opt.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              whileTap={{ scale: 0.96 }}
              className="relative flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:px-6"
            >
              {selected && (
                <motion.div
                  layoutId={`${group}-surface`}
                  className={cn("absolute inset-0 rounded-full shadow-inner", opt.surfaceClass)}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                />
              )}
              {Icon && <Icon aria-hidden="true" className={cn("relative z-10 size-4", selected ? opt.activeTextClass : "text-muted")} />}
              <span className={cn("relative z-10 transition-colors duration-300", selected ? opt.activeTextClass : "text-muted hover:text-soft")}>
                {opt.label}
              </span>
              {selected && <motion.span layoutId={`${group}-dot`} className={cn("absolute -bottom-0.5 size-1 rounded-full", opt.dotClass)} />}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

/**
 * The two-column layout that swaps sides when the tab changes, with the original's spring. On a phone
 * it's one column (picture on top) and doesn't flip.
 */
export function FlipLayout({ flipped, visual, children }: { flipped: boolean; visual: ReactNode; children: ReactNode }) {
  const spring = { type: "spring", bounce: 0, duration: 0.9 } as const;
  return (
    <div className={cn("flex flex-col items-center gap-16 lg:flex-row lg:items-start lg:justify-center lg:gap-20 xl:gap-28", flipped && "lg:flex-row-reverse")}>
      <motion.div layout="position" transition={spring} className="flex shrink-0 flex-col items-center lg:sticky lg:top-28 lg:pt-10">
        {visual}
      </motion.div>
      <motion.div layout="position" transition={spring} className="w-full max-w-xl min-w-0">
        {children}
      </motion.div>
    </div>
  );
}
