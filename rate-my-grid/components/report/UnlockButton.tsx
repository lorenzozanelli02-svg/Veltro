"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Arrow, buttonClass } from "../Button";

export function UnlockButton({ id, price }: { id: string; price: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.url === "string") {
        window.location.assign(data.url);
        return;
      }
      setError("Checkout isn't available right now. Please try again in a minute.");
    } catch {
      setError("We lost the connection. Check your signal and try again.");
    }
    setBusy(false);
  }

  return (
    <div>
      <button type="button" onClick={unlock} disabled={busy} className={buttonClass({ className: "w-full" })}>
        {busy ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : null}
        {busy ? "Opening checkout" : `Unlock full report · ${price}`}
        {!busy && <Arrow />}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
