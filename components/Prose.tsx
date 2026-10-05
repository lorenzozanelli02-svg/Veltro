export function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 pt-8 sm:px-6 sm:pt-16">
      <h1 className="font-display text-5xl leading-[1] tracking-[-0.01em] sm:text-7xl">{title}</h1>
      <div className="mt-8 space-y-4 text-[17px] leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[30px] [&_h2]:leading-tight [&_h2]:text-ink">
        {children}
      </div>
    </article>
  );
}
