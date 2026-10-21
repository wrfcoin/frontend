# Public-route accessibility evidence

Local fixture data, never the live site. Default dark theme at 1440×900 and 390×844. No station registration, provider credentials or transfer submission.

Baseline: 50 captures at 8e606e18. Full follow-up: 52 captures after incorporating main 5242b9a6; the added station-details form exposed one secondary-button contrast failure at each width. A darker purple button background and a six-capture focused rerun removed it. `audit.json` combines the full follow-up with those six final states. All 52 final states have zero serious/critical axe violations. This is not WCAG conformance.

Reproduce: `npm run qa:visual -- --axe --no-tall --out /tmp/public-a11y`. Focused flow: add `--only connect-station-unlocked,wallet-send-review`. axe-core 4.11.1 is installed through the lockfile.

The script records incomplete rules and lower-severity findings. Moderate missing-h1/heading-order findings remain on onboarding, map, search, station details and station setup; region/landmark findings also remain. These are not labelled passing. Screen-reader and light-theme coverage remain unverified. No observed serious/critical item needed a component redesign.

Wallet review: twelve forward and six reverse Tab stops remained in the modal at both widths; Escape returned focus to Send. Station setup is a non-modal wizard: keys → verify → name → coordinates → location action → optional location/hardware fields, then the page shell. No credentials were entered.

## Counts by route/state

| Route/state | Before serious nodes (desktop/phone) | After serious/critical nodes (desktop/phone) |
|---|---|---|
| home | 4 / 4 | 0 / 0 |
| onboarding | 1 / 1 | 0 / 0 |
| map | 15 / 7 | 0 / 0 |
| explore | 46 / 10 | 0 / 0 |
| explorer | 46 / 10 | 0 / 0 |
| search | 2 / 2 | 0 / 0 |
| station-detail | 5 / 5 | 0 / 0 |
| leaderboard | 14 / 12 | 0 / 0 |
| contributor | 2 / 2 | 0 / 0 |
| governance | 32 / 6 | 0 / 0 |
| governance-proposal | 1 / 6 | 0 / 0 |
| forecast | 3 / 3 | 0 / 0 |
| wallet-locked | 1 / 1 | 0 / 0 |
| connect-station-locked | 1 / 1 | 0 / 0 |
| downloads | 4 / 3 | 0 / 0 |
| terms | 1 / 1 | 0 / 0 |
| privacy | 1 / 1 | 0 / 0 |
| api-terms | 1 / 1 | 0 / 0 |
| security | 1 / 1 | 0 / 0 |
| forecast-filled | 3 / 3 | 0 / 0 |
| home-dismissed | 4 / 4 | 0 / 0 |
| downloads-unpublished | 4 / 4 | 0 / 0 |
| wallet-unlocked | 18 / 6 | 0 / 0 |
| connect-station-unlocked | 1 / 1 | 0 / 0 |
| connect-station-form | new form / new form | 0 / 0 |
| wallet-send-review | 17 / 5 | 0 / 0 |
