# Contributor profile visual evidence

Local checkout only, with the merged visual-QA harness's populated `Hilltop`
fixture. These images are synthetic QA evidence, not live contributor statistics.
The fixture supplies a quality score of 0.93, displayed unchanged as 0.93%.
Role payments are disabled in this harness configuration; no empty payment card
is rendered. Missing statistics are covered by the component regression test.

Before: frontend main `fb6df9fc4ed11d1f97e528d8e24fade16bcacac7`.
After: this PR's page and regression test changes.

```sh
npm run qa:visual -- --only contributor --out docs/screenshots/launch/contributor/before
npm run qa:visual -- --only contributor --out docs/screenshots/launch/contributor/after
```

The before command was run with the original page; the after command with the
changed page. Each run reported four clean captures, with no error boundary,
page error, horizontal overflow or loading splash. Desktop is 1440 pixels wide;
phone is 390 CSS pixels wide at device scale 2. Tall variants expose the complete
scrolling page. Screenshots were inspected at both widths.

| View | Before | After |
|---|---|---|
| Desktop | [Before](before/contributor-desktop-1440.png) | [After](after/contributor-desktop-1440.png) |
| Phone | [Before](before/contributor-phone-390.png) | [After](after/contributor-phone-390.png) |
| Desktop tall | [Before](before/contributor-desktop-1440-tall.png) | [After](after/contributor-desktop-1440-tall.png) |
| Phone tall | [Before](before/contributor-phone-390-tall.png) | [After](after/contributor-phone-390-tall.png) |
