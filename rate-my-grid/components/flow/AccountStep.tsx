"use client";

import { BadgeCheck, ImagePlus, Loader2, Search } from "lucide-react";
import { useId } from "react";
import { parseInstagramHandle } from "@/lib/instagram-handle";
import type { ProfilePreview } from "@/lib/lookup/types";
import { Arrow, buttonClass } from "../Button";
import { MonoTag, STEP_ACTIONS, StepLayout } from "./StepHeading";

const LOOKED_AT = ["Your name, bio and link", "Your last 12 posts, with likes and comments", "How often you post"];

const count = (n: number | null) => (n === null ? "–" : n.toLocaleString("en-GB"));

export function AccountStep({
  handle,
  onHandleChange,
  handleError,
  looking,
  profile,
  onLookup,
  onReset,
  onScore,
  onUseScreenshots,
}: {
  handle: string;
  onHandleChange: (value: string) => void;
  handleError: string | null;
  /** The username being looked up right now, if any. */
  looking: string | null;
  profile: ProfilePreview | null;
  onLookup: () => void;
  onReset: () => void;
  onScore: () => void;
  onUseScreenshots: () => void;
}) {
  const id = useId();
  const parsed = parseInstagramHandle(handle);
  // Show the cleaned-up name when someone pastes a link or adds an @, so they know what will be looked up.
  const cleaned = parsed.ok && parsed.username !== handle.trim() ? parsed.username : null;

  return (
    <StepLayout
      title="Which account should we"
      accent="score?"
      intro="Paste your Instagram link or type your username."
      aside={
        <div className="mt-8 hidden lg:block">
          <MonoTag>What we look at</MonoTag>
          <ul className="mt-4 space-y-2.5 text-[15px] text-soft">
            {LOOKED_AT.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-slate-300/50" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            We only see what&rsquo;s public, and we never ask for your password.
          </p>
        </div>
      }
    >
      {profile ? (
        <div className="animate-rise">
          <div className="glass rounded-3xl p-5 sm:p-6">
            <MonoTag className="mb-5 flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-good" />
              Account found
            </MonoTag>
            <div className="flex items-center gap-4">
              {profile.avatar ? (
                <span className="shrink-0 rounded-full bg-ig p-[2px]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- small data URL from the lookup */}
                  <img src={profile.avatar} alt="" className="size-18 rounded-full border-2 border-slate-950 object-cover" />
                </span>
              ) : (
                <span className="size-18 shrink-0 rounded-full bg-raised ring-1 ring-line" />
              )}
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-lg leading-snug font-medium text-slate-50">
                  <span className="truncate">{profile.fullName || `@${profile.username}`}</span>
                  {profile.isVerified && <BadgeCheck aria-label="Verified" className="size-5 shrink-0 text-accent" />}
                </p>
                <p className="truncate text-[15px] text-muted">
                  @{profile.username}
                  {profile.category ? ` · ${profile.category}` : ""}
                </p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                ["Posts", profile.postsCount],
                ["Followers", profile.followers],
                ["Following", profile.following],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-2xl border border-slate-400/10 bg-slate-900/50 px-2 py-3">
                  <dd className="text-2xl leading-none font-light text-slate-50 tabular-nums">{count(value as number | null)}</dd>
                  <dt className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">{label}</dt>
                </div>
              ))}
            </dl>
            {profile.bio && <p className="mt-5 line-clamp-3 text-[15px] leading-relaxed whitespace-pre-line text-soft">{profile.bio}</p>}
            <p className="mt-4 text-sm font-medium text-accent">
              {profile.postsFound > 0 ? `${profile.postsFound} recent posts found` : "No posts found yet"}
            </p>
          </div>

          <div className={`${STEP_ACTIONS} mt-8 lg:flex lg:flex-row-reverse lg:items-center lg:justify-between lg:gap-6`}>
            <button type="button" onClick={onScore} className={buttonClass({ className: "w-full lg:w-auto lg:min-w-64" })}>
              Get my score
              <Arrow />
            </button>
            <button
              type="button"
              onClick={onReset}
              className="mt-3 block w-full text-center text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline lg:mt-0 lg:w-auto"
            >
              Not you? Try another username
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLookup();
          }}
          noValidate
        >
          <label htmlFor={id} className="block text-lg font-medium text-slate-50">
            Instagram username or profile link
          </label>
          <div className="relative mt-3">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
            <input
              id={id}
              type="text"
              value={handle}
              onChange={(e) => onHandleChange(e.target.value)}
              placeholder="@yourname or instagram.com/yourname"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              disabled={looking !== null}
              aria-invalid={handleError ? true : undefined}
              aria-describedby={`${id}-hint`}
              className="glass h-14 w-full rounded-2xl pr-4 pl-12 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none disabled:opacity-60 aria-invalid:border-bad"
            />
          </div>
          <p id={`${id}-hint`} className={`mt-2 min-h-5 text-sm ${handleError ? "text-bad" : "text-muted"}`}>
            {handleError ?? (cleaned ? `We'll look up @${cleaned}` : "Public accounts only.")}
          </p>

          <div className={`${STEP_ACTIONS} mt-8 lg:flex lg:flex-row-reverse lg:items-center lg:justify-between lg:gap-6`}>
            <button type="submit" disabled={looking !== null} className={buttonClass({ className: "w-full lg:w-auto lg:min-w-64" })}>
              {looking ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : null}
              {looking ? `Finding @${looking}` : "Find my account"}
              {!looking && <Arrow />}
            </button>
            <p className="mt-3 text-center text-xs text-muted lg:mt-0 lg:text-left lg:text-sm" aria-live="polite">
              {looking ? "This usually takes 10 to 30 seconds." : null}
            </p>
          </div>

          <button
            type="button"
            onClick={onUseScreenshots}
            disabled={looking !== null}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-400/25 px-4 py-4 text-[15px] font-medium text-soft transition-colors hover:border-slate-300/50 hover:text-ink disabled:opacity-50 lg:mt-10"
          >
            <ImagePlus aria-hidden="true" className="size-5" />
            Private account? Upload screenshots instead
          </button>
        </form>
      )}
    </StepLayout>
  );
}
