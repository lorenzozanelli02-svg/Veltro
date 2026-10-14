"use client";

import { AlertCircle, ImagePlus, Loader2, Lock, X } from "lucide-react";
import { useRef, useState } from "react";
import { prepareScreenshot, ScreenshotError } from "@/lib/prepare-image";
import { UPLOAD } from "@/lib/upload-rules";
import { Arrow, buttonClass } from "../Button";
import { ScreenshotGuide } from "./ScreenshotGuide";
import { StepLayout } from "./StepHeading";

export type Shot = { id: string; name: string; blob: Blob; url: string };

export type SubmitError = { code: string; message: string };

const ERROR_TITLES: Record<string, string> = {
  not_instagram: "We couldn't score these",
  unreadable: "We couldn't score these",
  rate_limited: "Slow down a little",
};

export function UploadStep({
  shots,
  onShotsChange,
  error,
  onSubmit,
}: {
  shots: Shot[];
  onShotsChange: (update: (shots: Shot[]) => Shot[]) => void;
  error: SubmitError | null;
  onSubmit: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const [processing, setProcessing] = useState(0);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const room = UPLOAD.maxFiles - shots.length;

  async function add(list: FileList | null) {
    if (!list?.length) return;
    const files = Array.from(list);
    const errors: string[] = [];
    if (files.length > room) {
      errors.push(`You can add up to ${UPLOAD.maxFiles} screenshots, so we've kept the first ${Math.max(room, 0)}.`);
    }
    const accepted = files.slice(0, Math.max(room, 0));
    setProcessing(accepted.length);
    for (const file of accepted) {
      try {
        const { blob } = await prepareScreenshot(file);
        const shot = { id: `${Date.now()}-${Math.random()}`, name: file.name, blob, url: URL.createObjectURL(blob) };
        onShotsChange((prev) => [...prev, shot].slice(0, UPLOAD.maxFiles));
      } catch (err) {
        errors.push(err instanceof ScreenshotError ? `“${file.name}” ${err.message}` : `“${file.name}” couldn't be added.`);
      }
      setProcessing((n) => n - 1);
    }
    setFileErrors(errors);
    if (input.current) input.current.value = "";
    // On a phone the guide fills the screen, so bring the new thumbnails into view.
    if (window.matchMedia("(max-width: 1023px)").matches) thumbs.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function remove(id: string) {
    onShotsChange((prev) => {
      const shot = prev.find((s) => s.id === id);
      if (shot) URL.revokeObjectURL(shot.url);
      return prev.filter((s) => s.id !== id);
    });
  }

  const ready = shots.length >= UPLOAD.minFiles && processing === 0;

  // On a computer, screenshots can also be dragged straight onto the page.
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      add(e.dataTransfer.files);
    },
  };

  return (
    <StepLayout
      title={<>Add 2&nbsp;to&nbsp;5 <span className="text-ig">screenshots</span></>}
      intro="Take these on your phone, then add them here."
      aside={
        <>
          {error && (
            <div role="alert" className="mt-6 flex gap-3 rounded-2xl border border-bad/40 bg-bad/8 p-4">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-bad" />
              <div>
                <p className="font-semibold">{ERROR_TITLES[error.code] ?? "That didn't work"}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ink/80">{error.message}</p>
              </div>
            </div>
          )}
          <div className="mt-7 lg:mt-10">
            <ScreenshotGuide />
          </div>
        </>
      }
    >
      <div
        ref={thumbs}
        {...dropHandlers}
        className={`scroll-mb-40 rounded-3xl transition-colors lg:border lg:border-dashed lg:p-6 ${dragging ? "lg:border-accent lg:bg-accent/8" : "lg:border-line lg:bg-surface/60"}`}
      >
        <div className="flex items-baseline justify-between">
          <p className="text-[17px] font-semibold">Your screenshots</p>
          <p className="text-sm text-muted tabular-nums">
            {shots.length} of {UPLOAD.maxFiles}
          </p>
        </div>

        {shots.length === 0 && processing === 0 && (
          <div className="hidden flex-col items-center justify-center py-16 text-center lg:flex">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-ig text-white">
              <ImagePlus aria-hidden="true" className="size-7" />
            </span>
            <p className="mt-5 text-lg font-semibold">Drag your screenshots here</p>
            <p className="mt-1 text-[15px] text-muted">PNG or JPG, up to {UPLOAD.maxFiles} images</p>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className={buttonClass({ variant: "secondary", size: "sm", className: "mt-6" })}
            >
              Browse files
            </button>
          </div>
        )}

        <ul className={`mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:mt-5 lg:gap-4 ${shots.length === 0 && processing === 0 ? "lg:hidden" : ""}`}>
          {shots.map((shot, i) => (
            <li key={shot.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={shot.url} alt={`Screenshot ${i + 1}`} className="aspect-[9/16] w-full rounded-xl border border-line object-cover object-top" />
              <button
                type="button"
                onClick={() => remove(shot.id)}
                aria-label={`Remove screenshot ${i + 1}`}
                className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full border border-line bg-bg text-ink shadow-lg hover:text-bad"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
          {Array.from({ length: processing }, (_, i) => (
            <li key={`p${i}`} className="flex aspect-[9/16] items-center justify-center rounded-xl border border-line bg-surface">
              <Loader2 aria-label="Adding screenshot" className="size-5 animate-spin text-accent" />
            </li>
          ))}
          {room - processing > 0 && (
            <li>
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 bg-accent/5 px-2 text-center text-sm font-semibold text-accent hover:bg-accent/10"
              >
                <ImagePlus aria-hidden="true" className="size-6" />
                Add
              </button>
            </li>
          )}
        </ul>
        <input
          ref={input}
          type="file"
          accept={UPLOAD.acceptedTypes.join(",")}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => add(e.target.files)}
        />

        {fileErrors.length > 0 && (
          <ul role="alert" className="mt-4 space-y-1.5 text-sm text-bad">
            {fileErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-10 bg-linear-to-t from-bg from-60% to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:bg-none sm:px-0 lg:mt-8 lg:flex lg:flex-row-reverse lg:items-center lg:justify-between lg:gap-6">
        {shots.length + processing < UPLOAD.minFiles ? (
          <button type="button" onClick={() => input.current?.click()} className={buttonClass({ className: "w-full lg:w-auto lg:min-w-64" })}>
            <ImagePlus aria-hidden="true" className="size-5" />
            {shots.length === 0 ? "Add screenshots" : `Add ${UPLOAD.minFiles - shots.length} more`}
          </button>
        ) : (
          <button type="button" disabled={!ready} onClick={onSubmit} className={buttonClass({ className: "w-full lg:w-auto lg:min-w-64" })}>
            {ready ? "Get my score" : "Adding screenshots"}
            {ready && <Arrow />}
          </button>
        )}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted lg:mt-0 lg:text-sm">
          <Lock aria-hidden="true" className="size-3.5" />
          Used only for your score. Never stored.
        </p>
      </div>
    </StepLayout>
  );
}
