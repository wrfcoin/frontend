# Public-copy captures

Local fixtures, never the live site. Before: 8e606e18; after: claims branch (base includes 5242b9a6).

Reproduce: `npm run qa:visual -- --no-tall --only home,onboarding,downloads,forecast,forecast-filled --out /tmp/claims`.

Both widths: 1440×900 and 390×844. Each before/after folder contains the five named states. The baseline captures came from the same harness during the accessibility pass. All ten after captures loaded without page errors, error boundaries, overflow or splash. Downloads uses a synthetic published manifest to exercise availability rather than a live release. No fixture values are production evidence.

After captures were refreshed following source review: the approved home/Forecast/Ambient product wording is retained. The canonical disclaimer, faucet/dashboard availability and publication states are corrected. Layout is unchanged.
