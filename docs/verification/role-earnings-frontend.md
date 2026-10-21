# Role earnings UI

Contract: backend main `920b2f81d8c6cbab0c2fca6a01c91b6da63e60ae`
(merged backend#1481), `server/routes/earnings-routes.ts`,
`server/services/chain-rewards/earnings.ts` and
`docs/verification/chain-role-earnings-b2.md`.

The public contributors page and internal GlobalLeaderboard include the same
role-payment board. Existing weather rankings retain their separate lifetime
and activity contract. WeatherRecap adds public canonical role totals, while
legacy weather DB totals keep their existing operator-only visibility. A
chain-only profile omits weather/share statistics rather than inventing them.

Role UI requires both the existing leaderboardRead gate and earningsRead.
Loading, poll errors, missing, reachable, simulated and unavailable capabilities
hide it. Configured, degraded and operational permit a read; the response must
still pass completeness, scope, coverage, units and amount validation. The
existing leaderboard and leaderboardRead route policies are unchanged.

The exact request is `/api/earnings/leaderboard?role=producer&period=all&limit=30`.
Order is role, period, limit; roles are contribution, attester, producer, node,
forecast; periods are all, 7d, 30d. No geo, duplicate or extra parameters are
sent. Public edge admission remains a separate deployment prerequisite; backend
capability presence does not prove deployed edge reachability. A refused read
shows unavailable and Retry rather than a partial ranking.

Only decimal-string base units and BigInt produce role payment displays. The
server's exact display string must agree. Unknown names remain neutral; N5 node,
Mango and Workstation are displayed only when supplied by the backend label
map. No client identity/address/key-prefix mapping exists. Public build profile
links stay hidden under the existing route policy; enabled studio links use only
validated opaque profile keys. Own-row labels require the served isYou bit.

Merged B2 has producer/attester coverage; contribution and forecast are
unavailable. Nodes show “Node payments are not implemented yet” with no ranking.
“No forecast payments observed” requires a future successful complete empty
forecast response and is never inferred from the current unavailable adapter.
An overall total is not computed from incomplete roles. Confirmed canonical
payments may roll back; the UI does not claim BFT finality.

Mounted tests use real frontend hooks/fetch and the CapabilitiesProvider with
synthetic B2-shaped responses. They cover exact grammar, lossless amounts above
2^53, approved/unknown labels, capability OFF/error/loading, role and period
races (including a transport ignoring abort), unavailable+Retry, malformed/partial
rankings, unsupported nodes, forecast availability, profile privacy and chain-only
profiles. Existing weather/privacy/capability and GlobalLeaderboard controls
remain required. These are local synthetic tests, not live endpoint, host,
deployment, image or device evidence. No deployment or GO authority is granted.

Validation on Node 24.15.0: npm ci; tsc --noEmit; the full Jest suite with
maxWorkers=2 (254 suites / 1,883 tests passed; one suite / two tests skipped);
all 77 pretest script controls and the zero-debt fabrication ratchet; the Node
suite (3/3); and the production Vite build all passed. BACKEND_REPO pointed to
the detached merged backend snapshot, so both normally optional fixture
reproduction tests executed. The mount/operation manifests were regenerated
from that snapshot; the only new family is earnings, with the 21 existing
weather operations preserved. The shrinking API baseline was not widened.

All 33 new mounted contract tests passed. Independent one-sided mutations
reordering role/period, passing money through Number, and removing the coverage
completeness check each failed this suite; all source changes were restored.
The existing GlobalLeaderboard read-state guard-reversal control also passed.
The reviewed-local-gate source hash was renewed with this evidence and no child
exemption. Vite reports its existing chunk-size guidance; compilation succeeds.
