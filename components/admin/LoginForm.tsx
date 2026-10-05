"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnPrimary, field } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      setError((await res.json()).error ?? "Sign in failed");
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={field} aria-describedby={error ? "login-error" : undefined} />
      </div>
      {error && (
        <p id="login-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
