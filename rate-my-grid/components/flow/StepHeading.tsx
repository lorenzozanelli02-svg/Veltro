export function StepHeading({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-[2.5rem] leading-[0.92] font-extrabold uppercase text-balance sm:text-5xl">{title}</h1>
      {children && <p className="mt-3 text-base leading-relaxed text-muted">{children}</p>}
    </div>
  );
}
