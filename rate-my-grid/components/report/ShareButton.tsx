"use client";

import { Download, Loader2, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Report } from "@/lib/report";
import { drawShareCard } from "@/lib/share-card";
import { SITE } from "@/lib/site";
import { buttonClass } from "../Button";

type CardData = Pick<Report, "score" | "verdict" | "categories"> & { goalLabel: string };

/** Makes the story-sized score image and offers the phone's share sheet, or a download. */
export function ShareButton({ data }: { data: CardData }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (image) return () => URL.revokeObjectURL(image.url);
  }, [image]);

  async function open() {
    dialog.current?.showModal();
    if (image) return;
    setBusy(true);
    try {
      const blob = await drawShareCard({ ...data, siteName: SITE.name });
      const file = new File([blob], "rate-my-grid-score.png", { type: "image/png" });
      setCanShare(Boolean(navigator.canShare?.({ files: [file] })));
      setImage({ file, url: URL.createObjectURL(blob) });
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!image) return;
    try {
      await navigator.share({ files: [image.file], title: "My Instagram score" });
    } catch {
      // Cancelled, or the share sheet isn't available after all.
    }
  }

  return (
    <>
      <button type="button" onClick={open} className={buttonClass({ variant: "secondary", size: "sm" })}>
        <Share2 aria-hidden="true" className="size-4" />
        Share my score
      </button>

      <dialog
        ref={dialog}
        aria-label="Share your score"
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl border border-line bg-surface p-5 text-ink backdrop:bg-black/80 backdrop:backdrop-blur-sm"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-2xl font-extrabold uppercase">Share your score</p>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="-mr-2 flex size-10 items-center justify-center rounded-full text-muted hover:text-ink"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="mt-4 flex aspect-[9/16] max-h-[55dvh] w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-bg">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated blob
            <img src={image.url} alt={`Story image: score ${data.score} out of 100. ${data.verdict}`} className="h-full w-full object-contain" />
          ) : busy ? (
            <Loader2 aria-label="Making your image" className="size-6 animate-spin text-accent" />
          ) : null}
        </div>
        <div className="mt-4 grid gap-2.5">
          {canShare && (
            <button type="button" onClick={share} disabled={!image} className={buttonClass({ className: "w-full" })}>
              <Share2 aria-hidden="true" className="size-4" />
              Share to your story
            </button>
          )}
          <a
            href={image?.url}
            download="rate-my-grid-score.png"
            aria-disabled={!image}
            className={buttonClass({ variant: canShare ? "secondary" : "primary", className: `w-full ${image ? "" : "pointer-events-none opacity-50"}` })}
          >
            <Download aria-hidden="true" className="size-4" />
            Download image
          </a>
        </div>
        <p className="mt-3 text-center text-xs text-muted">Or press and hold the image to save it.</p>
      </dialog>
    </>
  );
}
