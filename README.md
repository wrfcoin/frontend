# WRFCoin Frontend

WRFCoin Frontend is the React website for exploring the weather-data testnet, managing a wallet and connecting a weather station.

## Public testnet

Public launch: **2026-10-22**. This is a test network. It may be reset without notice. Balances and tokens have no monetary value. No migration to mainnet is promised or implied. Please attach no production bridges, exchange listings or irreplaceable assets.

- [WRFCoin website](https://wrfcoin.com)
- [Start with the quickstart](https://github.com/wrfcoin/docs/blob/main/testnet/quickstart.md)
- [Help and bug reports](https://github.com/wrfcoin/testnet-support)
- [Security reporting](SECURITY.md)

[Read the facts page](https://github.com/wrfcoin/docs/blob/main/testnet/facts.md).

## Today

The public build includes the pages below. Live values depend on the configured API and deployed capabilities: missing data is shown as unavailable. A page existing in source is not deployment or transaction-settlement evidence.

| Public route | What it provides |
| --- | --- |
| `/` | Testnet overview and navigation. |
| `/onboarding`, `/wallet` | Wallet setup, own-address balances, receive and client-signed testnet Send (subject to the Send switch and API readiness). |
| `/map`, `/weather/station/:stationId` | Station coverage and station details. |
| `/explore`, `/search` | Block exploration and search; `/explorer` redirects to Explore. |
| `/leaderboard/contributors`, `/contributor/:key` | API-reported contribution ranking and contributor profiles. |
| `/governance/public`, `/governance/public/:proposalId` | Read-only proposals and treasury information. |
| `/weather/forecast` | Current conditions and forecast display with source/availability labels. |
| `/connect-station` | Station connection flow; `/earn` is an alias. |
| `/downloads` | Software availability, platform notes and verification guidance. Signed downloads are not yet published. |
| `/terms`, `/privacy`, `/api-terms`, `/security` | Public policies and reporting information. |

The [route policy](src/config/contractSurfacePolicy.ts) admits the data, onboarding and wallet routes when `VITE_PUBLIC_READONLY_PATHS=true`; the name does not mean the wallet cannot submit a transfer. Home, Downloads and policy pages remain available without that flag. Operator-preview and full-studio modules are not the public product.

## Planned and experimental

DeFi trading, cross-chain value movement, NFT marketplaces, DAG/sharding dashboards and zero-knowledge wallet features are **not public testnet offerings**. Governance is read-only here. Forecast display does not establish a validated competitive forecasting or payout product.

## Run locally

Use Node.js 20+ and npm 10+. From this repository:

```sh
npm ci
VITE_PUBLIC_READONLY_PATHS=true npm run dev
```

Open the local URL printed by Vite (port 5000 by default). API-dependent pages need a compatible backend; starting Vite alone does not supply live data. See [CONTRIBUTING.md](CONTRIBUTING.md) for checks.

## Development reference

React, TypeScript and Vite power the app; shared UI components live in `src/components/DesignSystem/`. Maps use Leaflet, and server data uses TanStack Query.

| Command | Purpose |
| --- | --- |
| `npm run build` | Production bundle. |
| `npm run preview` | Preview a local bundle. |
| `npm run type-check` | TypeScript checks. |
| `npm test -- --maxWorkers=2` | Unit tests and pretest checks. |
| `npm run lint` | Static checks. |
| `npm run storybook` | Component library. |

Automated checks validate source behavior; they do not certify a live deployment or an end-to-end payout.

The bundled testnet notice is generated from core4's canonical `docs/TESTNET_DISCLAIMER.md`:

```sh
python3 scripts/build-testnet-disclaimer.py --source /path/to/core4/docs/TESTNET_DISCLAIMER.md
python3 scripts/build-testnet-disclaimer.py --source /path/to/core4/docs/TESTNET_DISCLAIMER.md --check
```

## License

Licensed under MIT OR Apache-2.0; see [LICENSE-MIT](LICENSE-MIT) and [LICENSE-APACHE](LICENSE-APACHE).
