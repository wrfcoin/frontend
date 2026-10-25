/**
 * Public-shell feature exposure controls.
 *
 * `VITE_ENABLE_FULL_STUDIO` is fail-closed and explicit. When the value is not the
 * exact string "true" the full shell remains hidden.
 */

import {
  isContractSurfacesEnabled,
  isFullStudioEnabled,
  isPublicReadonlyEnabled,
  isWalletSendEnabled,
} from './contractSurfacePolicy';

export { isPublicReadonlyEnabled } from './contractSurfacePolicy';

const FULL_STUDIO = isFullStudioEnabled(import.meta.env?.VITE_ENABLE_FULL_STUDIO);
const PUBLIC_READONLY = isPublicReadonlyEnabled(
  import.meta.env?.VITE_PUBLIC_READONLY_PATHS,
);
const CONTRACT_SURFACES = isContractSurfacesEnabled(
  import.meta.env?.VITE_ENABLE_CONTRACT_SURFACES,
);
// Owner 2026-10-15: public wallet parity, including password-confirmed Send.
const WALLET_SEND = isWalletSendEnabled(
  import.meta.env?.VITE_ENABLE_FULL_STUDIO,
  import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW,
  import.meta.env?.VITE_PUBLIC_READONLY_PATHS,
  import.meta.env?.VITE_DISABLE_WALLET_SEND,
);

// Passkey (WebAuthn) wallet preview: exact string "true" only; default OFF. Needs the backend's
// WRFCOIN_ENABLE_PASSKEY_SEND and core4's passkey_p256_auth (h3400 on chain 888).
const PASSKEY_WALLET = import.meta.env?.VITE_ENABLE_PASSKEY_WALLET === 'true';

/**
 * Opt-IN gate for surfaces that render fabricated data. (frontend#214)
 *
 * Read the polarity carefully, because it is deliberately the opposite of
 * MVP_MODE's. `MVP_MODE` is `=== 'true'`, so **unset means false**, so every
 * `!MVP_MODE` feature below is ON in a build with no env configured. For a flag
 * whose job is hiding invented data that default is backwards: an unset config
 * would ship the fabrication.
 *
 * So this one is also `=== 'true'` but used *positively* — unset, empty,
 * misspelled, or set to anything other than the literal string 'true' all land
 * on `false`, i.e. the safe side. This workspace deleted GENESIS_ORACLE_SET_ENV
 * in core4#2523 for exactly this failure mode: unset meant unenforced, silently.
 *
 * This is not a feature toggle for unfinished work. It marks surfaces that show
 * numbers no backend produced. Turning it on outside a demo puts invented data
 * in front of users, and after the genesis cut it does so beside real chain data.
 */
const DEMO_SURFACES = import.meta.env?.VITE_ENABLE_DEMO_SURFACES === 'true';

export const FEATURES = {
  /** Entire deferred studio shell. Default FALSE. */
  fullStudio: FULL_STUDIO,
  // Contract-backed surfaces are fail-closed until their launch gates pass.
  // Only the exact string "true" enables them; omitted or malformed values do not.
  contractSurfaces: CONTRACT_SURFACES,
  /** Surfaces rendering fabricated data. Default FALSE. See DEMO_SURFACES above. */
  demoSurfaces: DEMO_SURFACES,
  /** Stage 1.5 Explorer, Map, Search, and station detail reads. Default FALSE. */
  publicReadonly: PUBLIC_READONLY,

  // MVP features (always on)
  wallet: true,
  // Public wallet Send requires the exact public flag and an unlocked vault identity.
  walletSend: WALLET_SEND,
  /** Passkey wallet preview at /wallet/passkey. Default FALSE. */
  passkeyWallet: PASSKEY_WALLET,
  explorer: true,
  pop: true,
  mining: true,
  weather: true,
  governance: true,
  nfts: true,
  settings: true,
  resources: true,

  // Deferred features (off in MVP mode)
  crossChain: CONTRACT_SURFACES,
  carbon: CONTRACT_SURFACES,
  aiIntegration: FULL_STUDIO,
  privacy: FULL_STUDIO,
  defi: CONTRACT_SURFACES,
  staking: CONTRACT_SURFACES,
  sharding: FULL_STUDIO,
  iot: FULL_STUDIO,
  messaging: FULL_STUDIO,
  storage: FULL_STUDIO,
  cortex: FULL_STUDIO,
  standards: FULL_STUDIO,
  developer: FULL_STUDIO,
  analytics: FULL_STUDIO,
  integrations: FULL_STUDIO,
  infrastructure: FULL_STUDIO,
  smartContracts: CONTRACT_SURFACES,
  mobile: FULL_STUDIO,
  gamification: true,
  incentives: true,
  system: FULL_STUDIO,
  oracle: FULL_STUDIO,
  partners: FULL_STUDIO,
  achievements: true,

  // Frontend Refresh v2 - New feature flags
  identity: true,
  feeMarket: true,
  liquidStaking: CONTRACT_SURFACES,

  // Frontend Refresh v3 - New feature flags
  fleet: true,
  forecast: true,

  // Frontend Refresh v5 - New feature flags
  explorerMap: true,
  pipelines: FULL_STUDIO,
  aiMarketplace: FULL_STUDIO,
  carbonReporting: CONTRACT_SURFACES,
  collaboration: FULL_STUDIO,
  computeMarketplace: FULL_STUDIO,
  community: true,
  forecastStudio: FULL_STUDIO,

  // Frontend Refresh v6 - New feature flags
  notifications: true,
  leaderboard: true,
  governanceAdvanced: FULL_STUDIO,
  realTime: true,
  pwa: true,

  // Frontend Refresh v7 - New feature flags
  validatorOps: FULL_STUDIO,
  networkInsights: FULL_STUDIO,
  stationAnalytics: true,
  weatherIntelligence: true,
  bridgeAdvanced: CONTRACT_SURFACES,
  fieldTools: true,
  // Frontend Refresh v8 - New feature flags
  advancedOnboarding: FULL_STUDIO,
  zkVerification: FULL_STUDIO,
  executionDebugger: FULL_STUDIO,
  accessibilityHub: true,

  // Frontend Refresh v9 - New feature flags
  i18n: true,
  exportManager: true,
  weatherGlobe: true,

  // Viral growth
  referrals: FULL_STUDIO,
  impact: true,

  // Regional leaderboard region filter (frontend#151 polish).
  // Off by default until backend geographic filter (backend#695) lands; set
  // VITE_LEADERBOARD_REGIONS=true to preview the region-tab UI against a
  // backend that already supports ?region= / ?country= / ?near=.
  leaderboardRegions: import.meta.env?.VITE_LEADERBOARD_REGIONS === 'true',
} as const;

/**
 * Backward-compatible accessor name kept for existing callers.
 * Legacy behavior is "MVP mode means deferred surfaces are hidden", so this
 * returns the inverse of full-studio.
 */
export const isMvpMode = (): boolean => !FULL_STUDIO;

export type FeatureName = keyof typeof FEATURES;

// Dynamic capability hooks are provided via CapabilitiesContext:
//   import { useCapabilitiesContext } from '../contexts/CapabilitiesContext';
//   const { isFeatureEnabled, getFeatureStatus } = useCapabilitiesContext();
//
// Re-exported here for convenience so consumers can import from features.ts:
export { useFeatureEnabled, useFeatureStatus, useFeatureReadiness } from './featureHooks';

export default FEATURES;
