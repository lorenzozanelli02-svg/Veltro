/** The green tick from the Get Seen Get Signed "What's included" list. */
export function Check() {
  return (
    <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent ring-1 ring-accent/30">
      <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M5 10.5l3.2 3L15 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
