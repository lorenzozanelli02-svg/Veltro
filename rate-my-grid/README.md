# Rate My Grid

A one-page site that scores someone's Instagram out of 100 against their goal and tells them what to fix. The score and two or three fixes are free; the full report (Keep / Stop / Start, a rewritten bio, 10 post ideas and a 30-day plan) unlocks with a one-time payment.

Next.js (App Router) + Tailwind CSS v4, with the same dark theme and components as Get Seen Get Signed.

> **Status:** step 1 of 4. The whole flow works on a mocked AI response and mocked payments. The real Claude analysis, Stripe and Redis storage come next.

## Run it locally

```bash
cd rate-my-grid
npm install
cp .env.example .env.local   # optional: everything runs on mocks without keys
npm run dev                  # http://localhost:3000
```

Without keys you get the full flow: pick a goal, answer the questions, add 2 to 5 screenshots, wait on the loading screen, then see a demo report (clearly labelled) that you can "unlock" without paying.

To see the error screens, set `MOCK_AI_RESULT=not_instagram` (or `unreadable`) in `.env.local` and restart.

```bash
npm test           # unit tests
npm run typecheck
npm run build && npm start
```

## How it fits together

| What | Where |
| --- | --- |
| Name, price (£15) and contact email | `lib/site.ts` |
| Colours and fonts | `app/globals.css` (`@theme`), `app/layout.tsx` |
| Landing page sections | `components/landing/` |
| The scoring flow (goal, questions, upload, loading) | `components/flow/` |
| Report page | `app/r/[id]/page.tsx`, `components/report/` |
| Story-sized share image (1080×1920) | `lib/share-card.ts` |
| Report format, validated with Zod | `lib/report.ts` |
| Analysis (mock now, Claude next) | `lib/analyze.ts`, `lib/mock.ts` |
| Upload limits | `lib/upload-rules.ts` |

**Screenshots** are resized in the browser to JPEGs of at most 1568px, which keeps five of them under Vercel's 4.5 MB request limit. The server checks the real file type from the bytes, holds the images in memory only for the analysis, and never writes them anywhere.

**The paid sections** are generated in the same analysis as the free score but are only sent to the browser once the report is marked paid (`toPublicReport` in `lib/report.ts`). The blurred block on an unpaid report is placeholder shapes, not hidden content.

**Report links** are `/r/<id>` with a random 128-bit id. Free reports are kept 30 days, paid ones a year.

**Mocks never run in production** unless `DEMO_MODE=true`, so a missing key can't make reports free.

## Deploying to Vercel

1. Import the repository in Vercel and set **Root Directory** to `rate-my-grid`.
2. Add the environment variables from `.env.example`.

Until the Redis store is connected (step 4), run the mocked flow locally rather than on Vercel: Vercel doesn't keep memory between requests, so a mock report can vanish between the upload and the report page.

Full deployment steps, with Stripe webhooks and Upstash, will be added here when those are connected.
