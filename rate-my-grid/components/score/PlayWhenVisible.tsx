"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

/** Inside PlayWhenVisible: false until it scrolls into view. Elsewhere (the report page): always true. */
const Playing = createContext(true);

/**
 * Holds the ring, bar and rise animations inside it until it scrolls into view, then plays them, so
 * something below the fold still animates when it's seen. Without JavaScript they play on load.
 */
export function PlayWhenVisible({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(true);
      return;
    }
    // Restart the CSS animations together with the score count, once enough of the card is showing.
    el.dataset.anim = "wait";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        requestAnimationFrame(() => {
          delete el.dataset.anim;
          setPlaying(true);
        });
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Playing.Provider value={playing}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </Playing.Provider>
  );
}

/** A number that counts up from zero in step with the score ring. The page shows the final number before JavaScript runs. */
export function CountUp({ to, duration = 1100, delay = 150 }: { to: number; duration?: number; delay?: number }) {
  const playing = useContext(Playing);
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!playing) {
      setValue(0);
      return;
    }
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / duration, 0), 1);
      setValue(Math.round(to * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, to, duration, delay]);

  return <span aria-hidden="true">{value}</span>;
}
