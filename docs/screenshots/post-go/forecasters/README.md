# /forecasters and /forecasters/:profileKey (core4#3604 A4, [post-GO])

Captured with the repo's visual QA harness against this branch's Vite dev server, the backend
replaced by the harness fixtures (`scripts/visual-qa/fixtures.mjs`, the exact anonymous response shape
of backend `forecasters-routes.ts`). Reproduce:

```bash
npm run qa:visual -- --only forecasters,forecaster,forecasters-empty,forecaster-empty,forecasters-unavailable --axe --axe-rules color-contrast
```

Dark captures have no suffix; light ones end in `-light`. `-tall` = a tall viewport (1440×2400,
390×3200) so the whole page is visible (the app scrolls inside `.page-content`); `phone-390` without
`-tall` is the 390×844 viewport, showing the page clear of the Start bar. Axe colour-contrast: 0
violations in every capture of the run.

| Capture | What |
|---|---|
| `forecasters-*` | leaderboard, 7-day window, six fixture rows: counts, vs-previous delta, "Not yet available" skill |
| `forecaster-*` | one track record: totals, forecasts-per-day chart, by-variable/lead placeholders, recent decisions with `st_` station aliases |
| `forecasters-empty-*` | index running, no forecasts yet: "No forecasts yet · Learn how" |
| `forecaster-empty-*` | a forecaster with no decisions: "—" for first/last active, empty state |
| `forecasters-unavailable-*` | the backend 503 while the chain-reward index is off: "not available on this network yet" |

Addresses are visibly synthetic (`0xaaaa…aaaa`, `0xbbbb…bbbb`, …); profile keys and station aliases are
fixture values; nothing comes from the live site or a real node.
