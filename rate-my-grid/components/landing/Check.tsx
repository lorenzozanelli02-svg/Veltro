import { Check as CheckIcon } from "lucide-react";

/** The tick in the "what you get" lists. */
export function Check() {
  return (
    <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-accent/30">
      <CheckIcon className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}
