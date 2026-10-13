"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "./CopyButton";

export function SaveLink({ id, paid }: { id: string; paid: boolean }) {
  const [url, setUrl] = useState(`/r/${id}`);
  useEffect(() => setUrl(`${window.location.origin}/r/${id}`), [id]);
  return (
    <div className="rounded-2xl border border-line bg-surface/80 p-5 sm:p-6">
      <p className="font-semibold">Save your report link</p>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">
        {paid
          ? "This is the only way back to your report, so bookmark it or copy it somewhere safe."
          : "Come back to your score any time in the next 30 days. Unlocking keeps it for a year."}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 truncate rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm text-ink/80">{url}</p>
        <CopyButton text={url} label="Copy link" />
      </div>
    </div>
  );
}
