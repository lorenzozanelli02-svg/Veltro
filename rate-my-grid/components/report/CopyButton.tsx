"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // In-app browsers sometimes block the clipboard API; fall back to a hidden textarea.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-raised px-4 text-sm font-semibold transition-colors hover:border-accent/50 hover:text-accent ${copied ? "text-accent" : "text-ink"} ${className}`}
    >
      {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
