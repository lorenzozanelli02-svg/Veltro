"use client";

import { ArrowDown } from "lucide-react";
import Timeline from "@/components/ui/timeline";

const settings = {
  textColor: "var(--color-foreground, #ffffff)",
  mutedTextColor: "var(--color-muted-foreground, #a1a1aa)",
  activeColor: "#ff5f00",
  backgroundColor: "var(--color-background, #0a0a0a)",
  duration: 1.4,
};

export default function TimelineDemo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return (
    // The root layout already renders <main>, so this wrapper is a <div>.
    <div className="bg-[#0a0a0a] text-white">
      {/* Lead-in so the pinned timeline has somewhere to scroll in from. */}
      <section className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-400">
          Product roadmap
        </p>
        <h1 className="max-w-[18ch] text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Six years, one horizontal scroll.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-zinc-400">
          Keep scrolling — the section pins, the track slides sideways, and each
          milestone draws its stem and reveals its copy as it reaches centre.
        </p>
        <ArrowDown aria-hidden className="mt-2 size-5 animate-bounce text-zinc-400" />
      </section>

      {/* Realistic usage: custom copy, a branded accent, tuned reveal speed. */}
      <Timeline
        title="Product Storyline"
        periodLabel="2020 — 2026"
        backgroundColor={s.backgroundColor}
        textColor={s.textColor}
        mutedTextColor={s.mutedTextColor}
        activeColor={s.activeColor}
        imageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
        imageAlt="Clothing rails in a bright retail store"
        duration={s.duration}
      />

      <section className="flex h-screen items-center justify-center px-6 text-center text-sm text-zinc-400">
        From the first research note to a multi-market launch.
      </section>
    </div>
  );
}
