The backend manifest is generator output. From this worktree, after fetching backend origin:

```sh
node scripts/generate-backend-mounts.mjs $HOME/wrfcoin/backend
```

The generator reads Git objects at backend origin/main, records its full and short SHA, and checksums the payload. It inventories concrete safeMount/app.use prefixes, factory routes below bare /api mounts, and the entrypoint's raw path dispatch. A bare /api mount grants no wildcard authority. Versioned families include the next segment, so /api/v1/rewards does not admit /api/v1/defi.

api-surface-baseline.json records existing source families absent from that inventory. The Jest contract scans all production source, excluding tests, mocks, stories and fixtures; new absent families and stale baseline entries fail. Relative apiClient calls and imported aliases are included. Baseline entries are historical debt, not proof that those endpoints work. Remove an entry when its last caller disappears or its backend family becomes mounted. Do not add entries to accommodate new callers. The broader initial scan captures 20 historical families omitted by the original five-directory/literal-only scan; no new product caller was introduced.

Supply BACKEND_REPO=$HOME/wrfcoin/backend when running the contract test to opt into byte-equivalent fixture regeneration from fetched backend origin/main. The test neither fetches nor reads the backend working tree.

This is a conservative static family check: string literals and API/base templates can also describe examples or nested service bases. It does not prove method/endpoint parity, auth, edge reachability or deployment status, and cannot discover arbitrary computed URLs. Runtime public-route traversal checks remain separate.
