import { UPLOAD } from "./upload-rules";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp";
export type Screenshot = { mediaType: ImageMediaType; data: Buffer };

/** Trust the file's bytes, not its name or the type the browser claims. */
export function sniffImageType(buf: Uint8Array): ImageMediaType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => buf[i] === b)
  )
    return "image/png";
  if (
    buf.length >= 12 &&
    String.fromCharCode(...buf.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...buf.subarray(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

export async function readScreenshots(
  entries: FormDataEntryValue[],
): Promise<{ ok: true; images: Screenshot[] } | { ok: false; error: string }> {
  const files = entries.filter((e): e is File => typeof e !== "string");
  if (files.length < UPLOAD.minFiles || files.length > UPLOAD.maxFiles) {
    return { ok: false, error: `Add between ${UPLOAD.minFiles} and ${UPLOAD.maxFiles} screenshots.` };
  }
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > UPLOAD.maxTotalUploadBytes) return { ok: false, error: "Those screenshots are too large in total." };

  const images: Screenshot[] = [];
  for (const file of files) {
    if (file.size > UPLOAD.maxUploadBytes) return { ok: false, error: "One of the screenshots is too large." };
    const data = Buffer.from(await file.arrayBuffer());
    const mediaType = sniffImageType(data);
    if (!mediaType) return { ok: false, error: "Screenshots must be PNG, JPG or WebP images." };
    images.push({ mediaType, data });
  }
  return { ok: true, images };
}
