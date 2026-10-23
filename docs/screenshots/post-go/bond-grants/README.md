# /faucet/bond-grants (self-serve bond grant spec section 4)

Captured with the repo's visual QA harness against this branch's Vite dev server, the backend replaced by
the harness fixtures (`scripts/visual-qa/fixtures.mjs`: exactly the six fields the faucet's
`GET /faucet/bond-grants` returns, per infra `testnet/services/faucet/BOND_GRANT.md`). Reproduce:

```bash
npm run qa:visual -- --only bond-grants,bond-grants-empty,bond-grants-unavailable --axe --axe-rules color-contrast
```

Dark captures have no suffix; light ones end in `-light`. `desktop-1440` is the 1440×900 viewport (the
page fits); `phone-390-tall` is 390×3200 so the whole page is visible (the app scrolls inside
`.page-content`); `phone-390` is the 390×844 viewport. Axe colour-contrast: 0 violations and 0 incomplete
in all 24 captures of the run.

| Capture | What |
|---|---|
| `bond-grants-*` | four grants: `bonded` null ("Not yet available", what today's faucet returns), true and false |
| `bond-grants-empty-*` | the list is empty: "No grants yet" |
| `bond-grants-unavailable-*` | the 503 a network without the public audit list answers |

Wallets, keys and transaction hashes are visibly synthetic (`0xaaaa…aa01`, `a1a1…`); peer ids are
well-formed base58 shapes, not real nodes. Nothing comes from the live site or a real node.
