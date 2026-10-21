import React from 'react';
import { Route } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import DeprecatedRedirect from '../components/common/DeprecatedRedirect';
import FEATURES from '../config/features';

const DeFiPortfolio = lazy(() => import('../components/DeFi/DeFiPortfolio'));
const LiquidStakingDashboard = lazy(() => import('../components/Staking/LiquidStakingDashboard'));
const EnhancedBridgePage = lazy(() => import('../components/CrossChain/EnhancedBridgePage'));
const BridgeRouteOptimizer = lazy(() => import('../components/BridgeAdvanced'));
const LiquidityDepthChartAdvanced = lazy(() => import('../components/BridgeAdvanced/LiquidityDepthChart'));
const BridgeTransactionTracker = lazy(() => import('../components/BridgeAdvanced/BridgeTransactionTracker'));
const CrossChainPortfolio = lazy(() => import('../components/BridgeAdvanced/CrossChainPortfolio'));
const BridgeSecurityAudit = lazy(() => import('../components/BridgeAdvanced/BridgeSecurityAudit'));

export default function defiRoutes() {
  return <>
    {/* DeFi Portfolio */}
    {FEATURES.defi && <Route path="/defi" element={<PageWrapper tabType="defi"><DeFiPortfolio /></PageWrapper>} />}

    {/* Staking */}
    {FEATURES.staking && <Route path="/staking/vault" element={<DeprecatedRedirect to="/resources" />} />}
    {FEATURES.staking && <Route path="/staking/liquid" element={<PageWrapper tabType="staking"><LiquidStakingDashboard /></PageWrapper>} />}

    {/* Cross-Chain Bridge */}
    {FEATURES.crossChain && <>
      <Route path="/bridge" element={<PageWrapper tabType="bridge"><EnhancedBridgePage /></PageWrapper>} />
      <Route path="/bridge/monitor" element={<DeprecatedRedirect to="/bridge" />} />
      <Route path="/bridge/analytics" element={<DeprecatedRedirect to="/bridge" />} />
    </>}

    {/* Bridge Advanced */}
    {FEATURES.bridgeAdvanced && <>
      <Route path="/bridge/optimizer" element={<PageWrapper tabType="bridge"><BridgeRouteOptimizer /></PageWrapper>} />
      <Route path="/bridge/liquidity" element={<PageWrapper tabType="bridge"><LiquidityDepthChartAdvanced /></PageWrapper>} />
      <Route path="/bridge/tracker" element={<PageWrapper tabType="bridge"><BridgeTransactionTracker /></PageWrapper>} />
      <Route path="/bridge/portfolio" element={<PageWrapper tabType="bridge"><CrossChainPortfolio /></PageWrapper>} />
      <Route path="/bridge/security" element={<PageWrapper tabType="bridge"><BridgeSecurityAudit /></PageWrapper>} />
    </>}
  </>;
}
