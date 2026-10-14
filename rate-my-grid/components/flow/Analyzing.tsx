"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ScanFace } from "lucide-react";
import { useEffect, useState } from "react";
import { MonoLabel } from "@/components/ui/digital-serenity-animated-landing-page";
import { OrbitFrame, StatusPill } from "@/components/ui/spatial-product-showcase";

const MESSAGES = [
  "Reading your bio",
  "Checking your grid",
  "Looking at your recent posts",
  "Counting your calls to action",
  "Comparing to accounts that convert",
  "Writing your fixes",
];

const PROFILE_MESSAGES = [
  "Reading your bio",
  "Checking your grid",
  "Working out your engagement",
  "Counting your calls to action",
  "Comparing to accounts that convert",
  "Writing your fixes",
];

/** The bar creeps towards 95% and never claims to be finished; the page moves on when the score is ready. */
function useProgress() {
  const [progress, setProgress] = useState(0.03);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const seconds = (Date.now() - start) / 1000;
      setProgress(0.03 + 0.92 * (1 - Math.exp(-seconds / 28)));
    }, 250);
    return () => clearInterval(timer);
  }, []);
  return progress;
}

/**
 * The scanning screen: the visitor's own picture (their profile photo from the lookup, or their first
 * screenshot) in the circular frame, a light sweeping over it, and what we're doing right now.
 */
export function Analyzing({ username = null, image = null }: { username?: string | null; image?: string | null }) {
  const [index, setIndex] = useState(0);
  const progress = useProgress();
  const still = useReducedMotion();
  const messages = username ? PROFILE_MESSAGES : MESSAGES;

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 2600);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="flex min-h-[72dvh] flex-col items-center justify-center text-center">
      <MonoLabel text={username ? `Scoring @${username}` : "Scoring your profile"} stagger={90} line="none" />

      <div className="mt-14 mb-10 sm:mt-16">
        <OrbitFrame
          ringSeconds={12}
          pill={
            <StatusPill>
              <span aria-hidden="true">Scanning</span>
            </StatusPill>
          }
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- the visitor's own picture: a small data URL or a local preview
            <img src={image} alt="" className="size-full object-cover object-top" />
          ) : (
            <ScanFace aria-hidden="true" className="size-16 text-soft/70" strokeWidth={1.25} />
          )}
          {/* A band of light that sweeps down over the picture. */}
          {!still && (
            <motion.div
              aria-hidden="true"
              initial={{ top: "-30%" }}
              animate={{ top: "105%" }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.3 }}
              className="absolute inset-x-0 h-1/4 bg-linear-to-b from-transparent via-ig-pink/25 to-transparent"
            >
              <div className="absolute inset-x-0 top-1/2 h-px bg-linear-to-r from-transparent via-white/70 to-transparent" />
            </motion.div>
          )}
          <div aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_55%,rgb(2_6_23/0.55))]" />
        </OrbitFrame>
      </div>

      <div className="relative mt-6 h-[4.5rem] w-full max-w-xl sm:h-20" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            initial={still ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={still ? { opacity: 0 } : { opacity: 0, y: -14, filter: "blur(8px)" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-x-0 top-0 text-[1.75rem] leading-tight font-light tracking-tight text-balance text-slate-50 sm:text-4xl sm:font-extralight"
          >
            {messages[index % messages.length]}&hellip;
          </motion.p>
        </AnimatePresence>
      </div>

      <div
        className="mt-4 h-0.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-400/15"
        role="progressbar"
        aria-label="Analysis progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className="h-full rounded-full bg-ig transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">This usually takes under a minute. Keep this page open.</p>
    </div>
  );
}
