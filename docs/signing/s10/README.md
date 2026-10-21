# S10 typed signing core (Phase 1)

This module builds and signs governance votes, station security actions, transfers,
and transfer accepts. It is scoped to chain `777` / `testnet`. Governance uses the
owner-selected mobile v1 raw message, which does not bind a network. It must be
unavailable if the backend changes its signing version. The fields argument cannot supply a message, tag or serialized preimage
to be signed. The trusted unlocked-account adapter owns the signing primitive.

The unlocked account is supplied by the future S9 vault adapter. This module does
not unlock keys or enable any public write surface. Phase 2 must require a fresh
passphrase per action, app-equivalent preview and confirmation, authenticated
wallet identity, and a fresh ledger check immediately before signing. Verify
feature activation, current owner, nonce, expiry (tip + 5000, at most tip + 10000),
frozen/deactivated conditions and receiver identity as mobile does. An accepted
relay response means pending confirmation; poll the ledger for application.

For accepts the core already verifies the sender public key/address binding and
sender signature, plus the receiving account and recipient public key binding.
All security actions have fixed discriminants: report_stolen=1, unfreeze=2,
deactivate=3, reactivate=4. Nonces/heights are bigint, unsigned u64, never floats.
The relay currently restricts JSON numeric fields to safe integers; Phase 2 must
refuse larger ledger values rather than rounding them during JSON serialization.

## Reproducible provenance

All seeds below are published synthetic test inputs, never operational keys.
The eight fixtures use a 32-byte seed filled with `07` for the sender and `08`
for the recipient. Fields and exact preimage/signature hex for every case live
in `src/services/walletCrypto/__tests__/s10-mobile-vectors.json`.

The expected values were derived by actually executing the mobile production
builders and Ed25519TransferSigner, not by the frontend implementation:

- Mobile commit `48088bb882da2a8bcbf0a4ce38e7b97977965c18`.
- Source: `lib/services/crypto/governance_vote_signing.dart`,
  `lib/services/crypto/station_signing.dart`, `lib/services/crypto/signed_transfer.dart`.
- Copy `derive-mobile-vectors.dart` to `test/sol_s10_vectors_test.dart` in a
  detached mobile checkout at that commit, run `flutter pub get --offline`, then
  `flutter test --concurrency=2 test/sol_s10_vectors_test.dart`.
- Output: `/tmp/sol-s10-mobile-vectors.json`. The test asserts eight vectors.

Backend commit `e776103d0f5ed34df0b8b982a03f5eb9363f2065`:

```sh
/path/to/backend/node_modules/.bin/tsx docs/signing/s10/verify-backend.ts /path/to/detached/backend
```

Run from this frontend worktree. This invokes the real
`verifiedGovernanceVote` for both votes and changed-choice refusals, and the real
`validateOwnerActionBody` for four security actions and a dual-signed transfer.
It signs through the frontend core, checks mobile signature equality, and writes
`/tmp/sol-s10-web-payloads.json`. Station cryptographic verification is delegated
by the backend to core4; shape admission alone is not signature verification.

Core4 commit `adc3929ceb41c500bfe42033488906592be56d79`: copy `verify-core4.rs`
to `shared-protocol/tests/sol_s10_web.rs` in a detached checkout, then run:

```sh
S10_WEB_PAYLOADS=/tmp/sol-s10-web-payloads.json CARGO_BUILD_JOBS=3 cargo test -p wrfcoin-shared-protocol --test sol_s10_web -- --nocapture
```

It calls the actual `verify_stateless_with_domain` implementations. This proves
stateless signature, key binding and validity-window checks, not chain state,
feature activation, deployment, or acceptance by a live node.

## Phase 2 dependencies

S9 vault PR was absent at implementation preflight. Integrate once it exists;
public governance UI is frontend #549 and ownership card is #548. Public owner
write routes are not enabled here. When adding submit calls, inspect current
infra `testnet/edge/public_onboarding.caddy` and open the separately required
default-OFF, exact-method/path/content-type/size/rate-gated infra PR. Edge changes
require the owner's deployment window. This core is source-only evidence.
