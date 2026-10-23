# Axe baseline, public routes (2026-10-23)

Automated accessibility audit of every public route of the frontend, before and after
`feat(a11y): fix serious and critical axe findings on the public routes`.

## Method

- The repo's visual QA harness (`scripts/visual-qa/run.mjs`) with axe-core 4.11.1 injected into each page,
  **all rules**, against this checkout's Vite dev server with the backend replaced by the harness
  fixtures. Never the live site. Reproduce: `npm run qa:visual -- --no-tall --axe`.
- Every route and scenario in `scripts/visual-qa/plan.mjs` (31 captures, including the wallet unlocked
  through the real web-wallet setup, the Send dialog and the connect-station form) at 1440×900 and
  390×844, dark and light. **Before:** public `main` @ 0e24b3b, 124 audits (31 captures).
  **After:** this branch merged with `main` @ aa8909a (frontend#9 bond grants, #10 chart colours, #11
  dark-token contrast), 136 audits (34 captures; the bond-grant page and its two states are now on main).
- The bond-grant page's "before" column is its audit at wrfcoin/frontend#9's head (b8fbae2), taken
  before it merged.
- The harness also drives the keyboard inside the Send dialog (12 × Tab, 6 × Shift+Tab, Escape) and
  fails the run if focus leaves the dialog, Escape does not close it, or focus does not return to Send.
- **Colour contrast is out of scope for the fixes in this PR.** The dark-token contrast work landed
  separately (frontend#11); the "after" column is measured with it merged.

## Summary

| | Before | After |
|---|---|---|
| Serious/critical findings (all rules) | 9 nodes on 1 route: `role-img-alt` ×4, `color-contrast` ×3, `scrollable-region-focusable` ×2 | **0** (`role-img-alt` and `scrollable-region-focusable` fixed here; `color-contrast` fixed by frontend#11) |
| Moderate findings | `region`, `landmark-one-main`, `landmark-main-is-top-level`, `page-has-heading-one`, `heading-order` on every route | `region` ×4 on the Send dialog only (deferred) |
| Send dialog keyboard (4 viewport/theme combinations) | focus stays in the dialog both ways, Escape closes, focus returns to Send | unchanged (pass) |
| Start menu by keyboard | **no** (a `<div onClick>`; axe has no rule for it) | a `<button>` with `aria-expanded` and a visible focus ring; Enter or Space opens it; Escape closes it (from Start or a focused menu item) and returns focus to Start |

## Per route

"×n" counts affected nodes summed over the four audits of that route (1440, 1440 light, 390, 390 light);
the selector is axe's first target.

| Capture | Route | Serious/critical before | Serious/critical after | Moderate before | Moderate after |
|---|---|---|---|---|---|
| home | `/` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| onboarding | `/onboarding` | none | none | landmark-one-main ×4, page-has-heading-one ×4, region ×12 | none |
| map | `/map` | none | none | landmark-one-main ×4, page-has-heading-one ×4, region ×12 | none |
| explore | `/explore` | none | none | landmark-one-main ×4, region ×12 | none |
| explorer | `/explorer` | none | none | landmark-one-main ×4, region ×12 | none |
| search | `/search` | none | none | landmark-one-main ×4, page-has-heading-one ×4, region ×12 | none |
| station-detail | `/weather/station/st-0` | `color-contrast` serious ×3 (1440) `th:nth-child(1)`<br>`role-img-alt` serious ×4 (1440, 1440 light, 390, 390 light) `canvas`<br>`scrollable-region-focusable` serious ×2 (390, 390 light) `.MuiTableContainer-root` | none | heading-order ×8, landmark-one-main ×4, page-has-heading-one ×4, region ×12 | none |
| leaderboard | `/leaderboard/contributors` | none | none | landmark-one-main ×4, region ×12 | none |
| contributor | `/contributor/c_0123456789abcdef01234567` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| forecasters | `/forecasters` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| forecaster | `/forecasters/c_0123456789abcdef01234567` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| bond-grants (before: frontend#9 @ b8fbae2) | `/faucet/bond-grants` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| governance | `/governance/public` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| governance-proposal | `/governance/public/WIP-12` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| forecast | `/weather/forecast` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| wallet-locked | `/wallet` | none | none | landmark-one-main ×4, region ×12 | none |
| connect-station-locked | `/connect-station` | none | none | heading-order ×4, landmark-one-main ×4, page-has-heading-one ×4, region ×12 | none |
| downloads | `/downloads` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| terms | `/terms` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| privacy | `/privacy` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| api-terms | `/api-terms` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| security | `/security` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| forecast-filled | `/weather/forecast (44.9, -93.2)` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| home-dismissed | `/ (banner dismissed)` | none | none | landmark-main-is-top-level ×4, region ×16 | none |
| downloads-unpublished | `/downloads (shipped manifest)` | none | none | landmark-main-is-top-level ×4, region ×16 | none |
| forecasters-empty | `/forecasters (empty)` | none | none | landmark-main-is-top-level ×4, region ×16 | none |
| forecaster-empty | `/forecasters/c_0123456789abcdef01234567 (empty)` | none | none | landmark-main-is-top-level ×4, region ×16 | none |
| forecasters-unavailable | `/forecasters (unavailable)` | none | none | landmark-main-is-top-level ×4, region ×16 | none |
| bond-grants-empty (before: frontend#9 @ b8fbae2) | `/faucet/bond-grants (empty)` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| bond-grants-unavailable (before: frontend#9 @ b8fbae2) | `/faucet/bond-grants (unavailable)` | none | none | landmark-main-is-top-level ×4, region ×12 | none |
| wallet-unlocked | `/wallet` | none | none | landmark-one-main ×4, region ×16 | none |
| connect-station-unlocked | `/connect-station` | none | none | heading-order ×4, landmark-one-main ×4, page-has-heading-one ×4, region ×16 | none |
| connect-station-form | `/connect-station (station details)` | none | none | heading-order ×4, landmark-one-main ×4, page-has-heading-one ×4, region ×16 | none |
| wallet-send-review | `/wallet (Send reviewed)` | none | none | region ×4 | region ×4 |

## What was fixed (this PR)

| Finding | Where | Fix |
|---|---|---|
| `role-img-alt` (serious) | station report: observation and earnings charts (`<canvas role="img">` without a name) | `aria-label` on both Chart.js canvases |
| `scrollable-region-focusable` (serious) | station report: submission anomalies table, scrolls sideways at 390 | the `TableContainer` is a focusable, named region |
| Start control not keyboard-operable (not an axe rule) | taskbar, every page | `<button type="button" aria-expanded aria-haspopup>`; CSS reset keeps its look (pixel-identical before/after); `:focus-visible` ring; Escape closes the open menu and returns focus to Start |
| `landmark-main-is-top-level`, `landmark-one-main` | every page | the app shell's content container is the one `<main>` (it was `<div role="region">`); pages render plain containers (the policy pages an `<article>`). A test keeps any other `<main>` out of `src/`. |
| `region` | the taskbar (Start, title, chip, theme toggle, clock) | the taskbar is `<nav aria-label="Taskbar">` |
| `page-has-heading-one`, `heading-order` | onboarding, map, search, station report, connect-station | the visible page title is the `h1`; section and step titles are `h2`/`h3`; values that were drawn as headings ("87.5%", the quality score, metric values) are paragraphs. MUI `variant` is unchanged, so the look is unchanged. |

No page's appearance changed: a pixel diff of the 124 pre-merge captures (taskbar clock masked) shows only fixture
data that differs between runs (random block and transaction hashes, relative times, a freshly generated
wallet, chart time axes), and the taskbar Start button is pixel-identical in all four combinations.

## Deferred (needs more than a template or CSS change)

- **`region` on the Send dialog** (moderate, ×4): MUI renders the dialog's portal root
  (`role="presentation"`) outside every landmark. Fixing it means changing how dialogs mount (a container
  inside `<main>` or a custom `Modal` root), a component-level change.
- **Canvas and SVG chart text** cannot be scored by axe (reported as incomplete, not as a pass). Chart
  colours are themed per page; the forecaster chart's ratios were checked by hand in frontend#10.
- **Start menu content in the public build** (not an axe finding): the open menu shows a "WRF User /
  Connected to testnet" card and Settings / Refresh Node / Power Options buttons that do nothing for a
  public visitor. Removing or gating them is a shell content decision.
- **Map legend paints over the open Start menu** on `/map` (stacking order, visual): the Leaflet legend's
  z-index is above the menu's.

## Regression guard

`src/__tests__/a11yPublicPages.test.jsx` runs axe-core (now a declared devDependency at the version the
harness already used) in jsdom on the home, governance, terms, downloads and forecasters pages and fails on
any serious or critical finding (colour contrast and page-level landmark rules off: jsdom has no layout,
and a page is rendered without the shell). A planted `<img>` without alt text proves the checker is not
blind. A second test fails if any file in `src/` other than `App.jsx` renders `<main>`.
`src/components/Navigation/__tests__/StartMenu.a11y.test.jsx` pins the Start button semantics, the
taskbar landmark, Enter and Space opening it from the keyboard, Escape closing it (from Start and from a
focused menu item) with focus back on Start, and Escape doing nothing while it is closed.

**Where each check runs.** The jsdom guard and the StartMenu tests are part of `npm test`, so hosted CI
(`test.yml`) runs them on every PR. The browser harness (`npm run qa:visual -- --axe`), which is the only
place colour contrast and the Send-dialog keyboard trap are checked, runs locally; no workflow runs it
yet. A CI job would need Playwright with a browser and the Vite server, as `explorer-health-probe.yml`
already sets up for its own probe.
