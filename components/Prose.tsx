export function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 pt-4 sm:px-6">
      <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">{title}</h1>
      <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-muted [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink">
        {children}
      </div>
    </article>
  );
}
