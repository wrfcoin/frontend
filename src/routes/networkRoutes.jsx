import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import FEATURES from '../config/features';
import {
  isFullStudioEnabled,
  isPublicReadonlyEnabled,
} from '../config/contractSurfacePolicy';

// Explorer
const UnifiedExplorer = lazy(() => import('../components/explorer/NetworkExplorer'));
const SearchResults = lazy(() => import('../components/Search/SearchResults'));
const PublicReadOnlyExplorer = lazy(() => import('../components/explorer/PublicReadOnlyExplorer'));
const PublicReadOnlySearch = lazy(() => import('../components/Search/PublicReadOnlySearch'));
const PublicBondGrantsPage = lazy(() => import('../pages/PublicBondGrantsPage'));

const PUBLIC_READONLY =
  isPublicReadonlyEnabled(import.meta.env?.VITE_PUBLIC_READONLY_PATHS) &&
  !isFullStudioEnabled(import.meta.env?.VITE_ENABLE_FULL_STUDIO);

// Network
const FeeMarketDashboard = lazy(() => import('../components/Network/FeeMarketDashboard'));

// Validators
const ValidatorOperationsCenter = lazy(() => import('../components/ValidatorOps'));
const StakingManager = lazy(() => import('../components/ValidatorOps/StakingManager'));
const SlashingMonitor = lazy(() => import('../components/ValidatorOps/SlashingMonitor'));
const BlockProductionStats = lazy(() => import('../components/ValidatorOps/BlockProductionStats'));
const ValidatorCompare = lazy(() => import('../components/ValidatorOps/ValidatorCompare'));

// Network Insights
const NetworkTopologyMap = lazy(() => import('../components/NetworkInsights'));
const CompactBlockRelayStats = lazy(() => import('../components/NetworkInsights/CompactBlockRelayStats'));
const LightClientPanel = lazy(() => import('../components/NetworkInsights/LightClientPanel'));
const MempoolVisualizer = lazy(() => import('../components/NetworkInsights/MempoolVisualizer'));
const PBSExplorer = lazy(() => import('../components/NetworkInsights/PBSExplorer'));
const StateSyncPanel = lazy(() => import('../components/NetworkInsights/StateSyncPanel'));
const P2PSyncOrchestrator = lazy(() => import('../components/NetworkInsights/P2PSyncOrchestrator'));

// ZK Verification
const ProofVerificationUI = lazy(() => import('../components/ZKVerification'));
const PrivacyProofExplorer = lazy(() => import('../components/ZKVerification/PrivacyProofExplorer'));
const TheProverUI = lazy(() => import('../components/ZKVerification/TheProverUI'));

// Execution Debugger
const ExecutionTraceViewer = lazy(() => import('../components/ExecutionDebugger'));
const TransactionInspector = lazy(() => import('../components/ExecutionDebugger/TransactionInspector'));
const StateDebugger = lazy(() => import('../components/ExecutionDebugger/StateDebugger'));

// Oracle
const SlashingHistoryPage = lazy(() => import('../pages/SlashingHistoryPage'));
const OracleLeaderboardPage = lazy(() => import('../pages/OracleLeaderboardPage'));

/**
 * @param {Object} opts
 * @param {boolean} opts.validatorOpsEnabled
 * @param {boolean} opts.networkInsightsEnabled
 */
export default function networkRoutes({ validatorOpsEnabled, networkInsightsEnabled, isFeatureEnabled = () => false }) {
  return <>
    {/* Explorer */}
    <Route path="/explore" element={<PageWrapper tabType="explorer">{PUBLIC_READONLY ? <PublicReadOnlyExplorer /> : <UnifiedExplorer />}</PageWrapper>} />
    <Route path="/explorer" element={<Navigate to="/explore?tab=blocks" replace />} />
    <Route path="/dag-explorer" element={<Navigate to="/explore?tab=dag" replace />} />
    <Route path="/search" element={<PageWrapper tabType="search">{PUBLIC_READONLY ? <PublicReadOnlySearch /> : <SearchResults />}</PageWrapper>} />
    {/* Faucet bond-grant audit list (read-only); the public route policy decides reachability */}
    <Route path="/faucet/bond-grants" element={<PageWrapper tabType="explorer"><PublicBondGrantsPage /></PageWrapper>} />

    {/* Network */}
    {isFeatureEnabled('feeMarket') && <Route path="/network/fees" element={<PageWrapper tabType="network"><FeeMarketDashboard /></PageWrapper>} />}

    {/* Validators */}
    {validatorOpsEnabled && <>
      <Route path="/validators" element={<PageWrapper tabType="network"><ValidatorOperationsCenter /></PageWrapper>} />
      <Route path="/validators/staking" element={<PageWrapper tabType="network"><StakingManager /></PageWrapper>} />
      <Route path="/validators/slashing" element={<PageWrapper tabType="network"><SlashingMonitor /></PageWrapper>} />
      <Route path="/validators/blocks" element={<PageWrapper tabType="network"><BlockProductionStats /></PageWrapper>} />
      <Route path="/validators/compare" element={<PageWrapper tabType="network"><ValidatorCompare /></PageWrapper>} />
    </>}

    {/* Network Insights */}
    {networkInsightsEnabled && <>
      <Route path="/network/topology" element={<PageWrapper tabType="network"><NetworkTopologyMap /></PageWrapper>} />
      <Route path="/network/relay" element={<PageWrapper tabType="network"><CompactBlockRelayStats /></PageWrapper>} />
      <Route path="/network/light-clients" element={<PageWrapper tabType="network"><LightClientPanel /></PageWrapper>} />
      <Route path="/network/mempool" element={<PageWrapper tabType="network"><MempoolVisualizer /></PageWrapper>} />
      <Route path="/network/pbs" element={<PageWrapper tabType="network"><PBSExplorer /></PageWrapper>} />
      <Route path="/network/state-sync" element={<PageWrapper tabType="network"><StateSyncPanel /></PageWrapper>} />
      <Route path="/network/p2p-sync" element={<PageWrapper tabType="network"><P2PSyncOrchestrator /></PageWrapper>} />
    </>}

    {/* ZK Verification */}
    {FEATURES.zkVerification && <>
      <Route path="/zk/proofs" element={<PageWrapper tabType="network"><ProofVerificationUI /></PageWrapper>} />
      <Route path="/zk/privacy" element={<PageWrapper tabType="network"><PrivacyProofExplorer /></PageWrapper>} />
      <Route path="/zk/prover" element={<PageWrapper tabType="network"><TheProverUI /></PageWrapper>} />
    </>}

    {/* Execution Debugger */}
    {FEATURES.executionDebugger && <>
      <Route path="/debug/traces" element={<PageWrapper tabType="network"><ExecutionTraceViewer /></PageWrapper>} />
      <Route path="/debug/transactions" element={<PageWrapper tabType="network"><TransactionInspector /></PageWrapper>} />
      <Route path="/debug/state" element={<PageWrapper tabType="network"><StateDebugger /></PageWrapper>} />
    </>}

    {/* Oracle */}
    <Route path="/oracle/slashing" element={<PageWrapper tabType="network"><SlashingHistoryPage /></PageWrapper>} />
    <Route path="/oracle/leaderboard" element={<PageWrapper tabType="network"><OracleLeaderboardPage /></PageWrapper>} />
  </>;
}
