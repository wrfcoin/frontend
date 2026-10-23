# Forecaster chart: theme-aware colours (before / after)

`before-*` is public `main` @ 0e24b3b; `after-*` is this branch. `*-chart-*` are close-ups of the
"Forecasts per day" card with one bar hovered, so the tooltip and the hover band are drawn (a scratch
Playwright script on top of the visual-QA harness's own Vite config and fixtures; the harness itself
does not hover). `*-page-*` are the visual-QA harness's 1440×900 captures of `/forecasters/<c_ key>` and
show the taskbar title. Dark files have no suffix; light ones end in `-light`.

What changes in the light theme: gridlines from the dark `rgba(51, 65, 85, 0.6)` to the light border
token, tick labels from #94A3B8 (2.56:1 on white, below WCAG AA) to #64748B (4.76:1), a light tooltip
instead of the dark #1E293B box, a slate-100 hover band instead of a heavy grey one, and bars from
sky-400 (2.14:1 on white) to sky-600 (4.10:1). The dark theme is unchanged apart from gridlines using
the border token (0.5 alpha instead of 0.6). The taskbar title keeps the `c_` key's case.

Fixture data only (`scripts/visual-qa/fixtures.mjs`); nothing comes from the live site or a real node.
