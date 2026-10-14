export function StepHeading({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-[2.5rem] leading-[0.92] font-extrabold uppercase text-balance sm:text-5xl lg:text-6xl">{title}</h1>
      {children && <p className="mt-3 text-base leading-relaxed text-muted lg:mt-5 lg:text-lg">{children}</p>}
    </div>
  );
}

/**
 * Phone: one column. Computer: the step's title and help on the left, what you fill in on the right,
 * like a normal website form.
 */
export function StepLayout({
  title,
  intro,
  aside,
  children,
}: {
  title: React.ReactNode;
  intro: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 xl:gap-24">
      <div className="lg:sticky lg:top-10 lg:self-start">
        <StepHeading title={title}>{intro}</StepHeading>
        {aside}
      </div>
      <div className="mt-8 lg:mt-1">{children}</div>
    </div>
  );
}
