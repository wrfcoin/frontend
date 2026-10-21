# WRFCoin Frontend Route Ownership Map

> Generated 2026-02-15 from `App.jsx` (primary router) and `config/features.ts`
> The former secondary router `components/routes/AppRoutes.jsx` was retired in frontend#290: every route
> it defined has a live equivalent in `App.jsx` / `src/routes/*` (see Notes). `App.jsx` is the only router.

---

## Route Table

Routes are extracted from `App.jsx`. The "Feature Flag" column shows the guard from `config/features.ts` that controls route availability. "always" means the route is rendered unconditionally.

### Dashboard & Core

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/` | NewDashboard | always | dashboard | active |
| `/dashboard/legacy` | `<Navigate to="/" />` | always | dashboard | redirect |
| `/dashboard/optimized` | `<Navigate to="/" />` | always | dashboard | redirect |
| `/tabs/*` | TabContainer | always | dashboard | active |
| `/infrastructure` | InfrastructureCapacityDashboard | `infrastructure` | dashboard | active (non-MVP) |

### Wallet

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/wallet` | OwnWalletAddress | always | wallet | active (owned address; Send requires unlocked owner, matching vault, public or operator gate, and password per send) |

### Mining & Compute

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/miner` | NewMinerPage | always | mining | active |
| `/compute` | ComputeMarketplace | `computeMarketplace` | mining | active (non-MVP) |

### Explorer

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/explore` | NetworkExplorer (unified) | always | explorer | active |
| `/explorer` | `<Navigate to="/explore?tab=blocks" />` | always | explorer | redirect |
| `/dag-explorer` | `<Navigate to="/explore?tab=dag" />` | always | explorer | redirect |

### NFTs

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/nfts` | UnifiedNFTDashboard | always | nft | active |
| `/nfts/details/:id` | ComputationalNFTPage | always | nft | active |
| `/nfts/enhanced` | EnhancedNFTPage | always | nft | active |
| `/nfts/graphql` | GraphQLQueryInterface | always | nft | active |

### Governance

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/governance` | `<Navigate to="/governance/comprehensive" />` | always | governance | redirect |
| `/governance/comprehensive` | ComprehensiveGovernanceDashboard | always | governance | active |
| `/governance/proposals/:id` | ProposalDetail | always | governance | active |
| `/governance/proposals/enhanced` | `<Navigate to="/governance/comprehensive" />` | always | governance | redirect |
| `/governance/foundation` | `<Navigate to="/governance/comprehensive" />` | always | governance | redirect |
| `/governance/eip712` | `<Navigate to="/resources" />` | always | governance | redirect |
| `/governance/quadratic` | QuadraticVotingPanel | `governanceAdvanced` | governance | active (non-MVP) |
| `/governance/conviction` | ConvictionVotingPanel | `governanceAdvanced` | governance | active (non-MVP) |
| `/governance/delegation` | DelegationManager | `governanceAdvanced` | governance | active (non-MVP) |
| `/governance/treasury` | TreasuryDashboard | `governanceAdvanced` | governance | active (non-MVP) |
| `/governance/analytics` | ProposalAnalytics | `governanceAdvanced` | governance | active (non-MVP) |

### Weather & Data Contribution

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/weather/home` | WeatherContributorHome | always | weather | active |
| `/weather/dashboard` | WeatherContributorDashboard | always | weather | active |
| `/weather/onboarding` | SensorOnboardingWizard | always | weather | active |
| `/weather/station/:stationId` | StationReportPage | always | weather | active |
| `/pop` | PopDashboard | always | pop | active |
| `/pop/submit` | EnhancedEnvironmentalDataForm | always | pop | active |
| `/fair-launch` | FairLaunchStatusPage | always | pop | active |
| `/quality` | DataQualityDashboard | always | weather | active |
| `/earnings` | EarningsDashboard | always | weather | active |
| `/map` | EnhancedWeatherMap | always | weather | active |
| `/forecast` | ForecastViewer | `forecast` | weather | active |
| `/forecast/studio` | ForecastStudio | `forecastStudio` | weather | active (non-MVP) |
| `/fleet` | FleetDashboard | `fleet` | weather | active |
| `/data/upload` | BatchUploadPage | always | weather | active |
| `/climate/reports` | ClimateReportDashboard | always | weather | active |
| `/pipelines` | PipelineBuilder | `pipelines` | weather | active (non-MVP) |
| `/collaboration` | CollaborativeAnalysis | `collaboration` | weather | active (non-MVP) |

### Identity & Reputation

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/identity` | IdentityDashboard | always | identity | active |
| `/identity/names` | NamingService | always | identity | active |
| `/identity/reputation` | ReputationDisplay | always | identity | active |

### Bridge & Cross-Chain

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/bridge` | EnhancedBridgePage | `crossChain` | bridge | active (non-MVP) |
| `/bridge/monitor` | `<Navigate to="/bridge" />` | `crossChain` | bridge | redirect |
| `/bridge/analytics` | `<Navigate to="/bridge" />` | `crossChain` | bridge | redirect |
| `/bridge/optimizer` | BridgeRouteOptimizer | `bridgeAdvanced` | bridge-advanced | active (non-MVP) |
| `/bridge/liquidity` | LiquidityDepthChart | `bridgeAdvanced` | bridge-advanced | active (non-MVP) |
| `/bridge/tracker` | BridgeTransactionTracker | `bridgeAdvanced` | bridge-advanced | active (non-MVP) |
| `/bridge/portfolio` | CrossChainPortfolio | `bridgeAdvanced` | bridge-advanced | active (non-MVP) |
| `/bridge/security` | BridgeSecurityAudit | `bridgeAdvanced` | bridge-advanced | active (non-MVP) |

### Network & Validators

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/network/fees` | FeeMarketDashboard | always | network | active |
| `/network/topology` | NetworkTopologyMap | `networkInsights` | network-insights | active (non-MVP) |
| `/network/relay` | CompactBlockRelayStats | `networkInsights` | network-insights | active (non-MVP) |
| `/network/light-clients` | LightClientPanel | `networkInsights` | network-insights | active (non-MVP) |
| `/network/mempool` | MempoolVisualizer | `networkInsights` | network-insights | active (non-MVP) |
| `/network/pbs` | PBSExplorer | `networkInsights` | network-insights | active (non-MVP) |
| `/network/state-sync` | StateSyncPanel | `networkInsights` | network-insights | active (non-MVP) |
| `/network/p2p-sync` | P2PSyncOrchestrator | `networkInsights` | network-insights | active (non-MVP) |
| `/validators` | ValidatorOperationsCenter | `validatorOps` | validator-ops | active (non-MVP) |
| `/validators/staking` | StakingManager | `validatorOps` | validator-ops | active (non-MVP) |
| `/validators/slashing` | SlashingMonitor | `validatorOps` | validator-ops | active (non-MVP) |
| `/validators/blocks` | BlockProductionStats | `validatorOps` | validator-ops | active (non-MVP) |
| `/validators/compare` | ValidatorCompare | `validatorOps` | validator-ops | active (non-MVP) |

### DeFi & Staking

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/defi` | DeFiPortfolio | `defi` | defi | active (non-MVP) |
| `/staking/vault` | `<Navigate to="/resources" />` | `staking` | staking | redirect |
| `/staking/liquid` | LiquidStakingDashboard | `staking` | staking | active (non-MVP) |

### Carbon & Sustainability

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/carbon/reporting` | CarbonReportDashboard | `carbonReporting` | carbon | active (non-MVP) |

### AI & Marketplace

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/ai-marketplace` | AIMarketplace | `aiMarketplace` | ai | active (non-MVP) |
| `/cortex` | CortexAIIntegration | `cortex` | ai | active (non-MVP) |

### Community & Leaderboard

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/community` | CommunityForums | always | community | active |
| `/leaderboard` | GlobalLeaderboard | `leaderboard` | leaderboard | active |
| `/leaderboard/station-of-the-day` | StationOfTheDay | `leaderboard` | leaderboard | active |
| `/leaderboard/profile/:address` | ContributorProfile | `leaderboard` | leaderboard | active |
| `/leaderboard/nearby` | NearbyStations | `leaderboard` | leaderboard | active |
| `/leaderboard/cooperatives` | CooperativeHub | `leaderboard` | leaderboard | active |
| `/gamification` | GamificationDashboard | `gamification` | gamification | active |
| `/achievements` | AchievementBadgeSystem | `achievements` | gamification | active |
| `/incentives` | EnhancedIncentives | `incentives` | gamification | active |

### Onboarding (Advanced)

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/weather/onboarding` | SensorOnboardingWizard | always | weather | active |
| `/onboarding` | EasyOnboardingSection | `mobile` | onboarding | active (non-MVP) |
| `/onboarding/qr` | QRScannerSetup | `advancedOnboarding` | advanced-onboarding | active |
| `/onboarding/auto-detect` | AutoDetectWizard | `advancedOnboarding` | advanced-onboarding | active |
| `/onboarding/streak-shield` | StreakShieldManager | `advancedOnboarding` | advanced-onboarding | active |

### ZK Verification

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/zk/proofs` | ProofVerificationUI | `zkVerification` | zk | active (non-MVP) |
| `/zk/privacy` | PrivacyProofExplorer | `zkVerification` | zk | active (non-MVP) |

### Execution Debugger

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/debug` | DebugPage | `developer` | debug | active (non-MVP) |
| `/debug/traces` | ExecutionTraceViewer | `executionDebugger` | debug | active (non-MVP) |
| `/debug/transactions` | TransactionInspector | `executionDebugger` | debug | active (non-MVP) |
| `/debug/state` | StateDebugger | `executionDebugger` | debug | active (non-MVP) |

### Real-Time

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/realtime/activity` | ActivityFeed | always | realtime | active |
| `/realtime/status` | ConnectionStatusPanel | always | realtime | active |

### Notifications

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/notifications/preferences` | NotificationPreferences | always | notifications | active |
| `/notifications/push-setup` | PushSetup | always | notifications | active |

### Accessibility

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/accessibility` | AccessibilitySettings | `accessibilityHub` | accessibility | active |
| `/accessibility/shortcuts` | KeyboardShortcutsOverlay | `accessibilityHub` | accessibility | active |
| `/accessibility/screen-reader` | ScreenReaderHelper | `accessibilityHub` | accessibility | active |

### I18n / Language

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/language` | LanguageSwitcher | `i18n` | i18n | active |
| `/language/translations` | TranslationManager | `i18n` | i18n | active |

### Export Manager

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/exports` | ExportDashboard | `exportManager` | exports | active |
| `/exports/templates` | ReportTemplateSelector | `exportManager` | exports | active |
| `/exports/scheduled` | ScheduledExports | `exportManager` | exports | active |

### Weather Globe (3D)

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/globe` | WeatherGlobe | `weatherGlobe` | globe | active |

### Integrations

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/integrations` | IntegrationsHub | `integrations` | integrations | active (non-MVP) |
| `/integrations/ai/*` | AIIntegrationsHub | `integrations` | integrations | active (non-MVP) |
| `/integrations/ai-plugins` | AIPluginsHub | `integrations` | integrations | active (non-MVP) |
| `/integrations/share` | WeatherDataSharingPage | `integrations` | integrations | active (non-MVP) |
| `/integrations/workflows` | N8nConfig | `integrations` | integrations | active (non-MVP) |
| `/integrations/story-protocol` | StoryProtocolIntegration | `integrations` | integrations | active (non-MVP) |
| `/integrations/bacalhau` | BacalhauPanel | `integrations` | integrations | active (non-MVP) |
| `/integrations/devices` | DataDeviceIntegrationsHub | `integrations` | integrations | active (non-MVP) |
| `/integrations/filecoin` | FilecoinPanel | `integrations` | integrations | active (non-MVP) |
| `/integrations/helium` | HeliumNetworkPanel | `integrations` | integrations | active (non-MVP) |
| `/integrations/sonm` | SonmCard | `integrations` | integrations | active (non-MVP) |
| `/integrations/luftdaten` | LuftdatenDashboard | `integrations` | integrations | active (non-MVP) |
| `/integrations/iexec` | iExecDashboard | `integrations` | integrations | active (non-MVP) |
| `/integrations/tatau` | TatauCloudDashboard | `integrations` | integrations | active (non-MVP) |
| `/integrations/golem` | GolemDashboard | `integrations` | integrations | active (non-MVP) |
| `/integrations/enhanced` | EnhancedIntegrationsHub | `integrations` | integrations | active (non-MVP) |
| `/integrations-enhanced` | IntegrationsEnhancedPage | `integrations` | integrations | active (non-MVP) |

### Communication & Messaging

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/messaging` | SecureMessaging | `messaging` | messaging | active (non-MVP) |
| `/messaging/hub` | MessagingHub | `messaging` | messaging | active (non-MVP) |
| `/messaging/test` | SecureMessagingTest | `messaging` | messaging | active (non-MVP) |
| `/address-book` | AddressBook | `messaging` | messaging | active (non-MVP) |

### IoT & Sensor Networks

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/IoT` | IoTDashboard | `iot` | iot | active (non-MVP) |
| `/iotex` | IoTeXPage | `iot` | iot | active (non-MVP) |
| `/sensor-community` | SensorCommunityPage | `iot` | iot | active (non-MVP) |

### Settings & Configuration

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/settings` | Settings | always | settings | active |
| `/settings/preferences` | UserPreferencesPage | always | settings | active |
| `/settings/privacy` | PrivacyPage | always | settings | active |
| `/terms` | PublicPolicyPage | always | resources | active |
| `/privacy` | PublicPolicyPage | always | resources | active |
| `/api-terms` | PublicPolicyPage | always | resources | active |
| `/security` | PublicPolicyPage | always | resources | active |
| `/settings/network` | NetworkPage | always | settings | active |
| `/settings/security` | SecurityPage | always | settings | active |
| `/settings/integrations` | IntegrationsPage | always | settings | active |
| `/settings/modules` | ModuleController | always | settings | active |

### Resources & Developer

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/resources` | Resources | always | resources | active |
| `/resources/wiki` | WikiDocs | always | resources | active |
| `/developer` | DeveloperPortal | `developer` | developer | active (non-MVP) |
| `/search` | SearchResults | always | search | active |

### System & Ops

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|
| `/oracle/dashboard` | OracleDashboard | `oracle` | oracle | active (non-MVP) |
| `/node-os` | NodeOSDashboard | `system` | system | active (non-MVP) |
| `/sharding` | ShardingDashboard | `sharding` | system | active (non-MVP) |
| `/system` | SystemMonitor | `system` | system | active (non-MVP) |
| `/security/blockchain` | BlockchainSecurityPanel | `system` | security | active (non-MVP) |
| `/mcp` | MCPDashboard | `system` | system | active (non-MVP) |
| `/smart-contracts` | SmartContractsPage | `smartContracts` | contracts | active (non-MVP) |
| `/storage` | DistributedStorageInterface | `storage` | storage | active (non-MVP) |
| `/partners` | PartnerDashboard | `partners` | partners | active (non-MVP) |
| `/mobile` | MobileApp | `mobile` | mobile | active (non-MVP) |
| `/analytics/unified` | UnifiedAnalyticsDashboard | `analytics` | analytics | active (non-MVP) |
| `/websocket-demo` | WebSocketDemo | `developer` | developer | active (non-MVP) |

### Developer Preview (Debug)

| Route Pattern | Component | Feature Flag | Module | Status |
|---|---|---|---|---|

### Redirects (Legacy Consolidation)

| Route Pattern | Target | Notes |
|---|---|---|
| `/dashboard/legacy` | `/` | Legacy dashboard removed |
| `/governance` | `/governance/comprehensive` | All governance to comprehensive |
| `/governance/proposals/enhanced` | `/governance/comprehensive` | |
| `/governance/foundation` | `/governance/comprehensive` | |
| `/governance/eip712` | `/resources` | EIP-712 moved to resources |
| `/staking/vault` | `/resources` | Staking vault moved to resources |
| `/bridge/monitor` | `/bridge` | Monitor tab merged |
| `/bridge/analytics` | `/bridge` | Analytics tab merged |
| `/standards` | `/resources` | Standards merged into resources |
| `/standards/*` | `/resources` | |
| `*` (catch-all) | `/` | Unmatched routes redirect home |

---

## Route Naming Conventions

### Path Hierarchy

Routes follow a `/module/sub-feature` pattern:

- **Top-level modules** use short names: `/wallet`, `/miner`, `/explorer`, `/defi`
- **Sub-features** are nested: `/governance/quadratic`, `/bridge/tracker`, `/validators/staking`
- **Parameterized routes** use `:param`: `/weather/station/:stationId`, `/nfts/details/:id`
- **Wildcard routes** use `*`: `/tabs/*`, `/settings/*`, `/integrations/ai/*`

### Module Prefixes

| Prefix | Domain |
|---|---|
| `/weather/*` | Weather contribution, quality, intelligence |
| `/station/*` | Station analytics and benchmarks |
| `/field/*` | Offline-first field operations |
| `/governance/*` | Governance and voting |
| `/bridge/*` | Cross-chain bridge operations |
| `/network/*` | Network infrastructure insights |
| `/validators/*` | Validator operations |
| `/settings/*` | User and system settings |
| `/integrations/*` | Third-party integrations |
| `/leaderboard/*` | Community rankings |
| `/onboarding/*` | Device and user onboarding |
| `/zk/*` | Zero-knowledge proof verification |
| `/debug/*` | Execution debugging and traces |
| `/globe/*` | 3D weather globe |
| `/exports/*` | Data export and reports |
| `/language/*` | Internationalization |
| `/accessibility/*` | Accessibility tools |
| `/notifications/*` | Notification management |
| `/realtime/*` | Real-time streaming displays |

---

## Explorer Consolidation Plan

The platform currently has multiple explorer-like surfaces that overlap:

| Current Route | Component | What It Shows |
|---|---|---|
| `/explorer` | Explorer | Traditional block/tx explorer |
| `/dag-explorer` | DAGExplorer | DAG consensus graph with D3 |
| `/network/topology` | NetworkTopologyMap | D3 force-directed peer graph |
| `/network/relay` | CompactBlockRelayStats | Bandwidth/latency metrics |
| `/network/mempool` | MempoolVisualizer | Mempool fee distribution |
| `/network/pbs` | PBSExplorer | Proposer-builder separation |
| `/network/light-clients` | LightClientPanel | Light client sync status |
| `/network/state-sync` | StateSyncPanel | Snapshot sync operations |

### Consolidation (Implemented — Session 6, PR #324)

1. **`/explore`** is now the canonical unified explorer with 5 tabs: Block Explorer, DAG View, Network, Topology, Network Insights
2. **`/explorer`** redirects to `/explore?tab=blocks`
3. **`/dag-explorer`** redirects to `/explore?tab=dag`
4. **`/network/*` routes** remain as deep-link targets; the "Network Insights" tab in `/explore` provides a card grid linking to each sub-view
5. The `NetworkExplorer` component (`components/explorer/NetworkExplorer.tsx`) is the unified orchestrator

### Migration Steps

1. Create `NetworkDashboard` index component at `/network`
2. Add tab/card navigation to existing `/network/*` sub-routes
3. Add `/network` entry to the main navigation sidebar
4. Keep individual `/network/*` routes functional for deep-linking

---

## Feature Flag Summary

Total feature flags in `config/features.ts`: 40

**Always-on (MVP):** wallet, explorer, pop, mining, weather, governance, nfts, settings, resources, gamification, incentives, achievements, identity, feeMarket, fleet, forecast, community, notifications, leaderboard, realTime, pwa, stationAnalytics, weatherIntelligence, fieldTools, advancedOnboarding, accessibilityHub, i18n, exportManager, weatherGlobe

**Non-MVP (require `VITE_MVP_MODE=false`):** crossChain, carbon, aiIntegration, privacy, defi, staking, sharding, iot, messaging, storage, cortex, standards, developer, analytics, integrations, infrastructure, smartContracts, mobile, oracle, partners, system, liquidStaking, pipelines, aiMarketplace, carbonReporting, collaboration, computeMarketplace, forecastStudio, governanceAdvanced, validatorOps, networkInsights, bridgeAdvanced, zkVerification, executionDebugger

---

## Notes

- `components/routes/AppRoutes.jsx` (retired 2026-09-16, frontend#290) was a parallel router never rendered by the `App.jsx` shell, and not used by any desktop build or test either — its only references were `tools/routeCLI.ts` (as an analysis input), `services/routeMapper.ts` (a comment) and an auto-generated Storybook story. Route-by-route it was superseded: `/mining`→`/miner`, `/wallet[/:address]`→`/wallet` (NewWalletPage), `/nft/*`→`/nfts/*` (UnifiedNFTDashboard), `/explorer/block|transaction/*`→`/explore`, `/settings/*`→`/settings/*`, `/bridge`→`/bridge` (EnhancedBridgePage), `/developer/portal`→`/developer`, `/analytics`→`/analytics/unified`, `/dashboard/distribution`→`/`, `/compute/{golem,iexec,tataucloud,luftdaten}`→the compute/integration pages that already route those dashboards; the rest were identical paths or redirects. Nine components it routed to are now imported by nothing (`WalletView`, `MinerDashboard`, `NFTGallery`, `NFTDetail`, `CreateNFTForm`, `BlockchainExplorer`, `SettingsPage`, `DistributionDashboard`, `CrossChainBridge`) — older generations of live pages; their removal is a separate decision, not part of #290.
- The `NotificationCenter` and `LiveDataTicker` components are rendered globally in the App shell, not as routed pages.
- All routes are lazy-loaded via `React.lazy()` and wrapped in `<Suspense>`.
