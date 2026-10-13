import { UPLOAD } from "./upload-rules";

/** Browser only. Checks a picked file and shrinks it to a JPEG small enough to upload quickly. */

export class ScreenshotError extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function prepareScreenshot(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const looksLikeImage = UPLOAD.acceptedTypes.includes(file.type) || /\.(png|jpe?g|webp|heic|heif)$/i.test(file.name);
  if (!looksLikeImage) throw new ScreenshotError("isn't an image. Use PNG or JPG screenshots.");
  if (file.size > UPLOAD.maxOriginalBytes) throw new ScreenshotError("is over 20 MB. Use a normal screenshot instead.");

  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await createImageBitmap(file);
  } catch {
    try {
      source = await loadImage(file);
    } catch {
      throw new ScreenshotError("couldn't be opened. Take a normal screenshot on your phone and add that.");
    }
  }

  const { width, height } = source;
  if (Math.min(width, height) < UPLOAD.minShortSidePx) {
    throw new ScreenshotError("is too small to read. Add a full-size screenshot.");
  }

  const scale = Math.min(1, UPLOAD.maxLongEdgePx / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ScreenshotError("couldn't be processed on this device.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  for (const quality of [0.86, 0.74, 0.62]) {
    const blob = await toBlob(canvas, quality);
    if (blob && blob.size <= UPLOAD.maxUploadBytes) return { blob, width: canvas.width, height: canvas.height };
  }
  throw new ScreenshotError("is too detailed to upload. Try a different screenshot.");
}
