/**
 * Tiny drawings of the three screenshots we want. The pink outlines mark what has to be visible.
 * Drawn rather than real screenshots so they never show a real person's account.
 */

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden="true" className="aspect-[9/16] w-full overflow-hidden rounded-[14px] border border-line bg-raised p-1.5">
      <div className="flex h-full flex-col gap-1 overflow-hidden rounded-[9px] bg-bg p-1.5">{children}</div>
    </div>
  );
}

const Line = ({ w, accent = false }: { w: string; accent?: boolean }) => (
  <div className={`h-[3px] rounded-full ${accent ? "bg-accent/70" : "bg-line"}`} style={{ width: w }} />
);

function Profile() {
  return (
    <Phone>
      <div className="flex items-center gap-1.5">
        <div className="size-5 shrink-0 rounded-full bg-muted/40 ring-1 ring-accent/70" />
        <div className="grid flex-1 grid-cols-3 gap-0.5 rounded-[3px] p-0.5 ring-1 ring-accent/70">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-0.5">
              <div className="mx-auto h-[3px] w-2.5 rounded-full bg-ink/70" />
              <div className="mx-auto h-[2px] w-3 rounded-full bg-line" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-[3px] rounded-[3px] p-0.5 ring-1 ring-accent/70">
        <Line w="45%" accent />
        <Line w="90%" />
        <Line w="75%" />
        <Line w="55%" />
      </div>
      <div className="flex gap-0.5">
        <div className="h-2 flex-1 rounded-[2px] bg-line" />
        <div className="h-2 flex-1 rounded-[2px] bg-line" />
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="size-2.5 rounded-full ring-1 ring-line" />
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-3 gap-[2px]">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[4/5] bg-line" />
        ))}
      </div>
    </Phone>
  );
}

function Grid() {
  return (
    <Phone>
      <div className="grid flex-1 grid-cols-3 content-start gap-[2px] rounded-[3px] p-0.5 ring-1 ring-accent/70">
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} className={`aspect-[4/5] ${i % 4 === 0 ? "bg-muted/35" : "bg-line"}`} />
        ))}
      </div>
    </Phone>
  );
}

function Post() {
  return (
    <Phone>
      <div className="flex items-center gap-1">
        <div className="size-2.5 rounded-full bg-muted/40" />
        <Line w="40%" />
      </div>
      <div className="aspect-[4/5] w-full bg-muted/30" />
      <div className="space-y-[3px] rounded-[3px] p-0.5 ring-1 ring-accent/70">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="size-[5px] rounded-full bg-ink/60" />
          ))}
        </div>
        <Line w="45%" accent />
        <Line w="85%" />
        <Line w="60%" />
      </div>
    </Phone>
  );
}

const SHOTS = [
  { title: "Your profile", text: "Top of your page: photo, numbers, bio and highlights", Image: Profile },
  { title: "Your grid", text: "Scroll down so 9 or more posts show", Image: Grid },
  { title: "A recent post", text: "Open one with the likes and caption showing. One or two.", Image: Post },
];

export function ScreenshotGuide() {
  return (
    <ol className="grid grid-cols-3 gap-3 sm:gap-4">
      {SHOTS.map(({ title, text, Image }, i) => (
        <li key={title}>
          <Image />
          <p className="mt-2.5 text-[13px] leading-tight font-medium text-slate-50 sm:text-sm">
            <span className="font-mono text-accent tabular-nums">{i + 1}.</span> {title}
          </p>
          <p className="mt-1 text-xs leading-snug text-muted">{text}</p>
        </li>
      ))}
    </ol>
  );
}
