/** Shared by the upload step (browser) and the analysis endpoint (server). */
export const UPLOAD = {
  minFiles: 2,
  maxFiles: 5,
  // What people may pick from their phone, before we shrink it.
  acceptedTypes: ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"],
  maxOriginalBytes: 20 * 1024 * 1024,
  minShortSidePx: 320,
  // The browser re-encodes every screenshot to a JPEG this size, which keeps 5 of them under Vercel's 4.5 MB request limit.
  maxLongEdgePx: 1568,
  maxUploadBytes: 900 * 1024,
  maxTotalUploadBytes: 4 * 1024 * 1024,
};
