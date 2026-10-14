import { CATEGORIES, scoreBand, type Report, type ScoreBand } from "./report";

/** Browser only. Draws the 1080×1920 story image: score, verdict, category scores and the site name. */

const W = 1080;
const H = 1920;
const COLORS = {
  bg: "#08070a",
  line: "#29242f",
  ink: "#f6f3f7",
  muted: "#a9a2b1",
  accent: "#f0418c",
};
const BAND: Record<ScoreBand, string> = { strong: "#f0418c", okay: "#fcaf45", weak: "#ff5a4f" };
// Instagram's gradient, yellow to purple.
const IG = ["#feda77", "#f58529", "#dd2a7b", "#8134af"];

function igGradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  IG.forEach((color, i) => g.addColorStop(i / (IG.length - 1), color));
  return g;
}

const SHORT_LABELS: Record<string, string> = { callToAction: "Call to action", goalFit: "Goal fit" };

function cssFont(variable: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback;
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawShareCard(
  data: Pick<Report, "score" | "verdict" | "categories"> & { goalLabel: string; siteName: string },
): Promise<Blob> {
  const display = cssFont("--font-barlow", "Arial Narrow, sans-serif");
  const sans = cssFont("--font-inter", "system-ui, sans-serif");
  await Promise.all([document.fonts.load(`800 100px ${display}`), document.fonts.load(`600 30px ${sans}`)]).catch(() => {});

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background: near-black, a faint grid, and Instagram-coloured glows behind the ring.
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(246,243,247,0.045)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 90) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  const fade = ctx.createRadialGradient(W / 2, 700, 200, W / 2, 700, 1100);
  fade.addColorStop(0, "rgba(8,7,10,0)");
  fade.addColorStop(1, "rgba(8,7,10,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, radius, rgb, alpha] of [
    [300, 900, 520, "245,133,41", 0.16],
    [800, 480, 560, "129,52,175", 0.26],
    [W / 2, 690, 640, "221,42,123", 0.22],
  ] as const) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `rgba(${rgb},${alpha})`);
    glow.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Eyebrow and goal. Everything sits between y=230 and y=1660, clear of Instagram's story overlays.
  ctx.fillStyle = COLORS.accent;
  ctx.font = `600 34px ${sans}`;
  setSpacing(ctx, 8);
  ctx.fillText("MY INSTAGRAM SCORE", W / 2, 260);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 34px ${sans}`;
  setSpacing(ctx, 0);
  ctx.fillText(`Goal: ${data.goalLabel}`, W / 2, 316);

  // Ring.
  const cx = W / 2;
  const cy = 690;
  const r = 262;
  ctx.lineWidth = 44;
  ctx.lineCap = "round";
  ctx.strokeStyle = COLORS.line;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = "rgba(221,42,123,0.8)";
  ctx.shadowBlur = 36;
  // Yellow at the bottom left to purple at the top right, like the Instagram logo.
  ctx.strokeStyle = igGradient(ctx, cx - r, cy + r, cx + r, cy - r);
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * data.score) / 100);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = COLORS.ink;
  ctx.font = `800 290px ${display}`;
  ctx.fillText(String(data.score), cx, cy + 92);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `600 30px ${sans}`;
  setSpacing(ctx, 6);
  ctx.fillText("OUT OF 100", cx, cy + 150);
  setSpacing(ctx, 0);

  // Verdict: shrink until it fits in three lines (four at the smallest size).
  const verdict = `“${data.verdict.toUpperCase()}”`;
  let size = 84;
  ctx.font = `800 ${size}px ${display}`;
  let lines = wrap(ctx, verdict, 900);
  while (lines.length > 3 && size > 56) {
    size -= 4;
    ctx.font = `800 ${size}px ${display}`;
    lines = wrap(ctx, verdict, 900);
  }
  lines = lines.slice(0, 4);
  ctx.fillStyle = COLORS.ink;
  const lineHeight = size * 0.98;
  lines.forEach((line, i) => ctx.fillText(line, W / 2, 1090 + i * lineHeight));

  // Category scores in a row.
  const top = 1090 + lines.length * lineHeight + 70;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, top);
  ctx.lineTo(W - 90, top);
  ctx.stroke();
  const colWidth = (W - 180) / CATEGORIES.length;
  CATEGORIES.forEach(({ key, label }, i) => {
    const x = 90 + colWidth * (i + 0.5);
    const score = data.categories[key].score;
    ctx.fillStyle = BAND[scoreBand(score)];
    ctx.font = `800 76px ${display}`;
    ctx.fillText(String(score), x, top + 110);
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 23px ${sans}`;
    ctx.fillText(SHORT_LABELS[key] ?? label, x, top + 152);
  });

  // Site name, small.
  ctx.font = `800 44px ${display}`;
  setSpacing(ctx, 1);
  const [first, last] = [`${data.siteName.split(" ").slice(0, -1).join(" ").toUpperCase()} `, data.siteName.split(" ").at(-1)!.toUpperCase()];
  const total = ctx.measureText(first + last).width;
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(first, W / 2 - total / 2, 1650);
  const lastX = W / 2 - total / 2 + ctx.measureText(first).width;
  ctx.fillStyle = igGradient(ctx, lastX, 1650, lastX + ctx.measureText(last).width, 1650);
  ctx.fillText(last, lastX, 1650);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}
