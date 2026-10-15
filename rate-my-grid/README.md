# Rate My Grid

A one-page site that scores someone's Instagram out of 100 against their goal and tells them what to fix. The score and two or three fixes are free; the full report (Keep / Stop / Start, a rewritten bio, 10 post ideas and a 30-day plan) unlocks with a one-time payment.

Next.js (App Router) + Tailwind CSS v4. Same layout, type and components as Get Seen Get Signed, in Instagram's colours (its orange-pink-purple gradient on a near-black background).

> **Status:** the flow, the Instagram username lookup and the Claude analysis (fixed rubric, evidence-checked) are built. Without keys everything runs on mocks. The lookup is ready for a real Apify token and the analysis for a real Anthropic key. Stripe and Redis storage come next.

## Run it locally

```bash
cd rate-my-grid
npm install
cp .env.example .env.local   # optional: everything runs on mocks without keys
npm run dev                  # http://localhost:3000
```

Without keys you get the full flow: pick a goal, answer the questions, type any username (or upload 2 to 5 screenshots), wait on the loading screen, then see a demo report (clearly labelled) that you can "unlock" without paying.

To try the fallback to screenshots, look up `private.account`, `no.such.account`, `slow.account`, `broken.account` or `incomplete.account` (fails the data check). The score tester is at `/admin/test`. To see the screenshot error screens, set `MOCK_AI_RESULT=not_instagram` (or `unreadable`) in `.env.local` and restart.

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
| **Scoring rubric (edit this to change how accounts are scored)** | `lib/rubric.ts` |
| Engagement benchmarks by follower count | `lib/benchmarks.ts` |
| What counts as a call to action in a caption | `lib/cta.ts` |
| Numbers worked out on the server | `lib/lookup/metrics.ts`, `lib/facts.ts` |
| Data check before scoring a lookup | `lib/lookup/completeness.ts` |
| The JSON the AI must return | `lib/analysis-schema.ts` |
| Evidence checks and adding up the score | `lib/scoring.ts` |
| The Claude call (and the mock) | `lib/analyze.ts`, `lib/mock.ts` |
| Hidden score tester | `/admin/test` (`app/admin/test`, `app/api/admin/score`) |
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
7. **Data check**: before anything is scored, the lookup must have returned the bio, follower and following counts, and at least 9 recent posts with their pictures and dates (or every post, for accounts with fewer than 9). If anything is missing the visitor gets a friendly message and screenshot upload instead, rather than a score built on guesses.
8. **Analysis**: see "How scoring works" below.

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

## How scoring works

Scores are built to be accurate and to come out the same every time for the same account.

1. **Numbers are worked out in code, never by the AI** (`lib/lookup/metrics.ts`): engagement rate (average likes plus comments per recent post, divided by followers), posts per week over the last 30 days, the gaps between posts, average likes and comments, the share of Reels, carousels and single images, and how many captions include a call to action (phrases in `lib/cta.ts`). Pinned posts are left out of frequency and engagement because they can be months old. If all 12 fetched posts are from the last 30 days, posts per week is measured over the time they cover, so people who post daily aren't undercounted. The AI gets these as facts, each with an id, and is told never to calculate.
2. **A fixed rubric** (`lib/rubric.ts`): five categories (bio, content, consistency, call to action, fit with goal), each out of 20, made of checks worth set points. Fit with goal has four checks for each goal. For each check the AI picks "met", "partly" or "not met" with a reason; the server converts that to points (5, 2 or 0 by default) and adds everything up to a total out of 100. Five checks are scored straight from the numbers whenever there's a lookup: link in bio, variety of formats including Reels, posting at least 3 times a week, no gaps over 10 days, and calls to action in captions.
3. **Evidence for everything** (`lib/scoring.ts`): every check, free fix and keep/stop/start point must cite their profile: exact words from the bio or name, a post by number (with exact caption words when quoting), one of the facts by id, or a screenshot by number. The server checks each one against the real data: quotes must really appear, posts and screenshots must exist, facts must be ones we supplied. Feedback left without evidence is dropped. For a check, the comment is dropped but the judgement still counts. Each report shows the evidence under every point.
4. **Benchmarks** (`lib/benchmarks.ts`): typical engagement rates by follower count. The report and the AI both get a plain comparison ("4.7% is above the typical 2% to 4.5% for accounts with 1,000 to 10,000 followers").
5. **Consistency settings** (`lib/analyze.ts`): the AI must answer in a fixed JSON format (structured outputs), with a fixed effort level (`ANALYSIS_EFFORT`, default `high`) and adaptive thinking. Claude Opus 5.5 doesn't accept a temperature setting, so none is sent; if `ANTHROPIC_MODEL` is set to an older model that does accept it (such as `claude-sonnet-4-6`), `ANALYSIS_TEMPERATURE` (default 0) is used. The prompt also tells the model to pick the lower result when an account sits between two.
6. **Score tester** (`/admin/test`): enter a list of usernames and see their scores side by side, or press **Run 3×** on one account to score it three times and see the spread for the total and each category, plus any checks that changed. Lookups come from the 24-hour cache, so repeat runs only re-run the AI. Each run is a real analysis and costs the same as a visitor's. On the live site it needs `ADMIN_TOKEN`; without it the page doesn't exist.

To change the scoring, edit `lib/rubric.ts` (points, wording of each check, what counts as met) and bump `RUBRIC_VERSION`. `npm test` checks every category still adds up to 20.

**The paid sections** are generated in the same analysis as the free score but are only sent to the browser once the report is marked paid (`toPublicReport` in `lib/report.ts`). The blurred block on an unpaid report is placeholder shapes, not hidden content.

**Report links** are `/r/<id>` with a random 128-bit id. Free reports are kept 30 days, paid ones a year.

**Mocks never run in production** unless `DEMO_MODE=true`, so a missing key can't make reports free.

## Deploying to Vercel

1. Import the repository in Vercel and set **Root Directory** to `rate-my-grid`.
2. Add the environment variables from `.env.example`, including `APIFY_TOKEN`, `ANTHROPIC_API_KEY` and a long random `ADMIN_TOKEN` for the score tester.

Until the Redis store is connected (step 4), run the mocked flow locally rather than on Vercel: Vercel doesn't keep memory between requests, so a mock report can vanish between the upload and the report page.

Full deployment steps, with Stripe webhooks and Upstash, will be added here when those are connected.
