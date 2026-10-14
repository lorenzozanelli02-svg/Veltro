import type { Answers } from "./goals";
import { profileMetrics } from "./lookup/metrics";
import { mockImage, mockProfile } from "./lookup/mock";
import { mockReport } from "./mock";
import type { PublicReport, ReportSource } from "./report";

/**
 * Data for the results demo page (app/demo/results): the mock report for a made-up coaching
 * account, with drawn stand-in pictures. No real person's account and no stock photos.
 */

const ANSWERS: Answers = {
  customer: "Busy mums who want to get fit",
  offer: "Online coaching, £150 a month",
  frequency: "weekly-plus",
  action: "book",
};

const dataUrl = (img: { mediaType: string; data: string }) => `data:${img.mediaType};base64,${img.data}`;

export type DemoView = "profile" | "screenshots";

/** The demo report. `pictures` are the profile picture and nine post images as image URLs. */
export function buildDemoReport({ view, paid, pictures }: { view: DemoView; paid: boolean; pictures: { avatar: string; posts: string[] } }): PublicReport {
  const profile = mockProfile("samcoach.fit");
  const metrics = profileMetrics(profile);
  const { full, ...free } = mockReport("clients", ANSWERS, view === "profile" ? metrics : undefined);

  const source: ReportSource =
    view === "profile"
      ? {
          kind: "profile",
          username: profile.username,
          fullName: profile.fullName,
          avatar: pictures.avatar,
          followers: profile.followers,
          postsCount: profile.postsCount,
          postsAnalysed: metrics.postsAnalysed,
          engagementRate: metrics.engagementRate,
          postsLast30Days: metrics.postsLast30Days,
          bio: profile.bio,
          thumbnails: pictures.posts.slice(0, 9),
        }
      : { kind: "screenshots", count: 3 };

  return {
    ...free,
    id: "demo",
    createdAt: new Date().toISOString(),
    goal: "clients",
    paid,
    demo: true,
    source,
    full: paid ? full : null,
  };
}

/** Server: the demo report with the stand-in pictures as small JPEGs, as a real lookup would save them. */
export async function demoReport({ view, paid }: { view: DemoView; paid: boolean }): Promise<PublicReport> {
  const profile = mockProfile("samcoach.fit");
  const [avatar, ...posts] = await Promise.all([
    mockImage("avatar", 160),
    ...profile.posts.slice(0, 9).map((post) => mockImage(post.id, 240)),
  ]);
  return buildDemoReport({ view, paid, pictures: { avatar: dataUrl(avatar), posts: posts.map(dataUrl) } });
}

/** A drawn stand-in for an uploaded profile screenshot (9:16), so the demo never shows a real account. */
export function demoScreenshot() {
  const tiles = ["#f3b391,#c4626f", "#5d6b8a,#2c3550", "#e8c9a0,#a87f5e", "#9b7bb8,#4f3a6e", "#8fc1ae,#3f7564", "#f0a07a,#8a4a5d", "#c4626f,#5d6b8a", "#a87f5e,#e8c9a0", "#4f3a6e,#9b7bb8"];
  const grads = tiles
    .map((pair, i) => {
      const [a, b] = pair.split(",");
      return `<linearGradient id="t${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
    })
    .join("");
  const grid = tiles.map((_, i) => `<rect x="${(i % 3) * 120 + (i % 3) * 2}" y="${470 + Math.floor(i / 3) * 150}" width="120" height="148" fill="url(#t${i})"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="364" height="790" viewBox="0 0 364 790" font-family="-apple-system, Helvetica, Arial, sans-serif">
  <defs>${grads}<linearGradient id="ring" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda77"/><stop offset=".5" stop-color="#dd2a7b"/><stop offset="1" stop-color="#8134af"/></linearGradient><linearGradient id="face" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f6c39b"/><stop offset="1" stop-color="#c4626f"/></linearGradient></defs>
  <rect width="364" height="790" fill="#000"/>
  <text x="16" y="44" fill="#fff" font-size="20" font-weight="700">samcoach.fit</text>
  <circle cx="58" cy="118" r="44" fill="none" stroke="url(#ring)" stroke-width="4"/>
  <circle cx="58" cy="118" r="38" fill="url(#face)"/>
  <circle cx="58" cy="108" r="13" fill="#fff" fill-opacity=".85"/><path d="M34 150c2-16 12-22 24-22s22 6 24 22z" fill="#fff" fill-opacity=".85"/>
  <g fill="#fff" font-size="17" font-weight="700" text-anchor="middle"><text x="160" y="116">214</text><text x="240" y="116">3,912</text><text x="318" y="116">480</text></g>
  <g fill="#fff" font-size="13" text-anchor="middle"><text x="160" y="136">posts</text><text x="240" y="136">followers</text><text x="318" y="136">following</text></g>
  <text x="16" y="194" fill="#fff" font-size="14" font-weight="700">Sam Carter</text>
  <text x="16" y="214" fill="#a8a8a8" font-size="13">Personal trainer</text>
  <text x="16" y="234" fill="#fff" font-size="14">Coach 💪 | Mum of 2 | 🏋️‍♀️</text>
  <text x="16" y="254" fill="#fff" font-size="14">Living my best life ✨</text>
  <text x="16" y="274" fill="#e0f1ff" font-size="14">linktr.ee/samcoach</text>
  <rect x="16" y="292" width="160" height="34" rx="8" fill="#262626"/><text x="96" y="314" fill="#fff" font-size="14" font-weight="600" text-anchor="middle">Following</text>
  <rect x="188" y="292" width="160" height="34" rx="8" fill="#262626"/><text x="268" y="314" fill="#fff" font-size="14" font-weight="600" text-anchor="middle">Message</text>
  <g fill="none" stroke="#3a3a3a" stroke-width="1.5"><circle cx="44" cy="372" r="28"/><circle cx="118" cy="372" r="28"/><circle cx="192" cy="372" r="28"/><circle cx="266" cy="372" r="28"/></g>
  <g fill="#fff" font-size="11" text-anchor="middle"><text x="44" y="418">Results</text><text x="118" y="418">Workouts</text><text x="192" y="418">Recipes</text><text x="266" y="418">FAQ</text></g>
  <rect x="0" y="440" width="364" height="1" fill="#262626"/>
  ${grid}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
