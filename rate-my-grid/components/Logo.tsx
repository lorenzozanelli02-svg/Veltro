// Instagram's colours along the diagonal of the 3×3 mark, from the bottom left to the top right.
const DIAGONAL = ["#feda77", "#f58529", "#dd2a7b", "#8134af", "#515bd4"];

/** Wordmark in the small monospaced style: a 3×3 grid mark, "RATE MY" in white, "GRID" in the Instagram gradient. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-mono text-[13px] leading-none font-medium tracking-[0.22em] whitespace-nowrap uppercase sm:text-sm ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5 shrink-0">
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2].map((col) => (
            <rect key={`${row}-${col}`} x={col * 5} y={row * 5} width="4" height="4" rx="0.8" fill={DIAGONAL[col + 2 - row]} />
          )),
        )}
      </svg>
      <span>
        Rate My <span className="text-ig">Grid</span>
      </span>
    </span>
  );
}
