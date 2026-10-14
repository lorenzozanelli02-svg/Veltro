"use client";

/**
 * "Spatial Product Showcase" from 21st.dev, adapted for Rate My Grid.
 *
 * The original shows stock product photos in a circular frame with a rotating dashed ring and a
 * pulsing glow. Here the frame only ever holds the visitor's own Instagram (their profile picture,
 * a preview of their profile or their screenshot): there are no stock images.
 */

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
      <motion.div
        aria-hidden="true"
        animate={still ? undefined : { rotate: 360 }}
        transition={{ duration: ringSeconds, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-14%] rounded-full border border-dashed border-white/15"
      />
      <motion.div
        aria-hidden="true"
        animate={still ? undefined : { scale: [1, 1.06, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute inset-0 rounded-full bg-linear-to-br opacity-40 blur-2xl", glow)}
      />
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/30 shadow-2xl backdrop-blur-sm",
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
