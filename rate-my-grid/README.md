# Rate My Grid

A one-page site that scores someone's Instagram out of 100 against their goal and tells them what to fix. The score and two or three fixes are free; the full report (Keep / Stop / Start, a rewritten bio, 10 post ideas and a 30-day plan) unlocks with a one-time payment.

Next.js (App Router) + Tailwind CSS v4. Same layout, type and components as Get Seen Get Signed, in Instagram's colours (its orange-pink-purple gradient on a near-black background).

> **Status:** step 1 of 4, plus the Instagram username lookup. The whole flow works on a mocked AI response, a mocked lookup and mocked payments. The lookup is ready for a real Apify token. The real Claude analysis, Stripe and Redis storage come next.

## Run it locally

```bash
cd rate-my-grid
npm install
cp .env.example .env.local   # optional: everything runs on mocks without keys
npm run dev                  # http://localhost:3000
```

Without keys you get the full flow: pick a goal, answer the questions, type any username (or upload 2 to 5 screenshots), wait on the loading screen, then see a demo report (clearly labelled) that you can "unlock" without paying.

To try the fallback to screenshots, look up `private.account`, `no.such.account`, `slow.account` or `broken.account`. To see the screenshot error screens, set `MOCK_AI_RESULT=not_instagram` (or `unreadable`) in `.env.local` and restart.

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
| The scoring flow (goal, questions, account, loading) | `components/flow/` |
| Username and link parsing | `lib/instagram-handle.ts` |
| Instagram lookup: Apify, mock, image download, cache, cost log | `lib/lookup/` |
| What the AI is told, and the data and images it's sent | `lib/analysis-prompt.ts` |
| Report page | `app/r/[id]/page.tsx`, `components/report/` |
| Story-sized share image (1080×1920) | `lib/share-card.ts` |
| Report format, validated with Zod | `lib/report.ts` |
| Analysis (mock now, Claude next) | `lib/analyze.ts`, `lib/mock.ts` |
| Rate limits | `lib/ratelimit.ts` |
| Upload limits | `lib/upload-rules.ts` |

**Screenshots** are resized in the browser to JPEGs of at most 1568px, which keeps five of them under Vercel's 4.5 MB request limit. The server checks the real file type from the bytes, holds the images in memory only for the analysis, and never writes them anywhere.

## Instagram username lookup

People can type a username or paste any profile link (`@name`, `name`, `instagram.com/name/?hl=en`, a stories link). `lib/instagram-handle.ts` cleans it up in the browser and again on the server.

1. **Lookup** (`POST /api/lookup`): the server runs Apify's Instagram Profile Scraper with the token in an `Authorization` header (it never reaches the browser), waits for the run (up to `LOOKUP_TIMEOUT_MS`), and reads the profile: name, bio, link, follower, following and post counts, category, and the latest 12 posts with captions, likes, comments, views, type and date.
2. **Images straight away**: the profile picture and post images are downloaded at once, because Instagram's links expire. Only Instagram's own image hosts are fetched. Each image is shrunk to a JPEG of at most 1080px with `sharp`.
3. **Cache**: the profile and its images are cached per username for 24 hours, so looking the same account up again (or scoring it) costs nothing. Private and missing accounts are remembered for 6 hours.
4. **Rate limits**: only lookups that reach Apify count: 5 per visitor per 10 minutes, 15 per day, and `DAILY_LOOKUP_CAP` across everyone. Each run is also capped at one result and `APIFY_MAX_CHARGE_PER_LOOKUP_USD`.
5. **Cost log**: every lookup writes one JSON line to the server log (on Vercel: Logs, search for `instagram_lookup`) with the username, whether it was cached, the outcome, how long it took and `costUsd`. `costUsd` is Apify's platform usage for the run plus `APIFY_COST_PER_RESULT_USD`.
6. **Never a dead end**: if the account is private, doesn't exist, or the lookup times out, fails or is rate limited, the visitor sees a friendly message and the screenshot upload instead. They can also choose screenshots themselves.
7. **Analysis**: the AI gets the profile as text with the numbers already worked out (engagement per post as a % of followers, posts in the last 30 days, days since the last post, which formats get the most engagement), plus the profile picture and post images, each labelled.

### Setting up Apify

1. Create an account at [apify.com](https://apify.com) and copy your API token from **Settings > API & Integrations**.
2. Open the Instagram Profile Scraper in the Apify Store and note its price per profile.
3. Set `APIFY_TOKEN` (and `APIFY_COST_PER_RESULT_USD` to that price) in `.env.local`, or in Vercel's environment variables.
4. Check it with a real account:

   ```bash
   npm run dev
   curl -s -X POST localhost:3000/api/lookup -H 'content-type: application/json' -d '{"handle":"natgeo"}'
   ```

   You should get the profile back, and the dev server log shows an `instagram_lookup` line with `costUsd`. Run it again: the second line says `"cached":true` and costs nothing. The first time, compare the cost with the run in the Apify console.

**The paid sections** are generated in the same analysis as the free score but are only sent to the browser once the report is marked paid (`toPublicReport` in `lib/report.ts`). The blurred block on an unpaid report is placeholder shapes, not hidden content.

**Report links** are `/r/<id>` with a random 128-bit id. Free reports are kept 30 days, paid ones a year.

**Mocks never run in production** unless `DEMO_MODE=true`, so a missing key can't make reports free.

## Deploying to Vercel

1. Import the repository in Vercel and set **Root Directory** to `rate-my-grid`.
2. Add the environment variables from `.env.example`, including `APIFY_TOKEN`.

Until the Redis store is connected (step 4), run the mocked flow locally rather than on Vercel: Vercel doesn't keep memory between requests, so a mock report can vanish between the upload and the report page.

Full deployment steps, with Stripe webhooks and Upstash, will be added here when those are connected.
