# Android publication wording

Local-only captures from the visual-QA fixtures with the shipped, unpublished
manifest. Before uses main fb6df9fc; after uses this PR. No live site or real
release artifact is used. The page now reports publication state without a
"Coming soon" promise.

```sh
node scripts/visual-qa/downloads-labels.mjs before
node scripts/visual-qa/downloads-labels.mjs after
```

Run before against the original page and after against the changed page. The
script starts this checkout's Vite on a reserved loopback port, selects Android,
and scrolls the card into view. Each run reports two captures without page
errors. The standard harness's downloads-unpublished scenario also reported two
clean viewport captures for each version.

| Width | Before | After |
|---|---|---|
| Desktop 1440 | [Before](before/android-1440.png) | [After](after/android-1440.png) |
| Phone 390 | [Before](before/android-390.png) | [After](after/android-390.png) |
