# Visual QA harness

One command that screenshots every public route of **this checkout** at desktop
1440 and phone 390, with the backend replaced by populated fixtures, and reports
anything broken (error boundary, page error, horizontal overflow, loading splash).
It never touches the live site or a real node.

```bash
npm run qa:visual
# → visual-qa-output/<timestamp>/index.html (contact sheet), report.json, *.png, vite.log
```

Exit code 0 = every capture clean; 1 = at least one problem (listed at the end);
2 = the harness itself failed.

## What it captures

- Every route in `plan.mjs` → `ROUTES` (home, onboarding, map, explore, explorer,
  search, leaderboard, governance list + one proposal, forecast, wallet and
  connect-station locked, downloads, the four policy pages), loaded fresh.
- Scenarios (`plan.mjs` → `SCENARIOS`): forecast with coordinates entered, home
  with the testnet banner dismissed (taskbar chip), downloads with the shipped
  `public/downloads/manifest.json` (nothing published), wallet unlocked after the
  **real** web-wallet setup and ed25519 login against a stubbed challenge,
  connect-station in that session, and the Send form reviewed (never confirmed).
- Each at `desktop-1440` (900 px and 2400 px tall) and `phone-390` (844 px and
  3200 px tall). The app scrolls inside `.page-content`, so a tall viewport is how
  you see a whole page; Playwright's `fullPage` would not.
- Each in both themes. The site defaults to dark and ignores the OS preference;
  the taskbar toggle stores `light` under `localStorage['wrfcoin-theme-mode']`, so
  the harness seeds that key the way a returning visitor's browser holds it. Dark
  captures keep their names; light ones end in `-light` (`home-desktop-1440-light.png`).
  A capture whose `body` class does not match the requested theme is a problem.

## Options

```bash
npm run qa:visual -- --out ./visual-qa-output/pr-123     # where to write
npm run qa:visual -- --only home,map,wallet-unlocked     # subset by name
npm run qa:visual -- --viewport phone-390 --no-tall      # one viewport, no tall pass
npm run qa:visual -- --base http://127.0.0.1:5173        # reuse a server you started
npm run qa:visual -- --theme light                       # dark, light or both (default both)
VISUAL_QA_PORT=5201 npm run qa:visual                    # port for the harness's own Vite
VISUAL_QA_CHROME=/path/to/chrome npm run qa:visual       # browser binary (default: system Chrome, else Playwright's Chromium)
```

The harness starts Vite with `scripts/visual-qa/vite.config.mjs`: the repo config
plus `VITE_PUBLIC_READONLY_PATHS=true`, chain 777 / testnet, **no `/api` dev proxy**
(the fixtures answer every `/api/*` call; the proxy would also swallow the SPA
route `/api-terms`) and an fs allow list that follows a symlinked `node_modules`.
It also sets `VITE_WALLET_AUTH_ORIGIN` to the harness's own origin, which the
stubbed login challenge carries; without it the wallet refuses to sign and the
unlocked scenarios show the locked page. With `--base`, start your server with
that variable set to its origin. If the browser is missing:
`npx playwright install chromium`.

## Fixtures

`fixtures.mjs` builds every stub at run start so relative times ("2 min ago",
"ends Oct 25") look right: chain status and blocks, stations and coverage zones
(coarse 0.1° fixture cells, no real station), leaderboard, governance proposals
and treasury (declared units), NOAA current/hourly/daily, wallet balance,
history, nonce and send, mobile station and ownership. The login challenge is
built in the exact `loginChallenge.ts` format for the harness's own origin, so the
wallet signs it. `fixtures/downloads-manifest.json` is a populated release
manifest; its hashes are SHA-256 digests of constant strings and must never be
copied into the shipped `public/downloads/manifest.json`.

Only `/api/*` and `/downloads/manifest.json` are intercepted. A glob such as
`**/api/**` would also catch the app's own `/src/hooks/api/*` modules; keep the
predicate path-based.

The station report page (`/weather/station/:id`) gets observation and submission
rows in the exact shape `weatherService` parses (`timestamp` / `createdAt` are
required), so its observation chart (Chart.js on a canvas) and submission cards
render; the per-station earnings endpoint is not asked for in the public build.

## Reading the output

`report.json` → `captures[]`: `name`, `route`, `viewport`, `file`, `title`, `h1`,
`boundary` (error-boundary text or null), `splash`, `banner`, `chip`,
`overflowX`, `pageErrors`, `problems`. `index.html` shows every capture as a tile;
tiles with problems have a red border.

The splash is detected structurally (an empty `#root`, or its `::after`
"Loading WRFCoin testnet…" content), and the route-level "Loading page…"
Suspense fallback is retried and, if it persists, reported. Without `--base`
the harness refuses to start when its port already answers (that would be
someone else's server) and aborts if its own server dies mid-run.

A capture that caught the "Loading WRFCoin testnet" splash is reported as a
problem: on a slow host re-run with `--only <name>`; it is a harness timing
miss, not a page defect, when the re-run is clean.

## Adding a route

Add it to `ROUTES` in `plan.mjs`; `scripts/__tests__/visual-qa-plan.test.mjs`
fails when a path in `src/config/publicNavigation.ts` is missing from the plan
(parameterised paths map through `PARAM_ROUTE_EXAMPLES`). Add the backend stub it
needs to `fixtures.mjs`.

## Accessibility audit

Run `npm run qa:visual -- --axe --no-tall --out /tmp/public-a11y` to inject the lockfile-installed axe-core into all 19 fixture routes and interactive states at both widths. This mode requires a loopback server. Serious/critical violations make the command fail; moderate/minor and incomplete checks stay in report.json for manual review. The station-details form is also opened without entering provider credentials or registering a station. Wallet review records twelve Tab stops and rejects focus escaping its dialog. This does not submit a transfer.

For a focused follow-up, `--axe-rules color-contrast,button-name` restricts the rules; such a run is partial coverage. Automated results do not establish WCAG conformance or replace keyboard/screen-reader review.
