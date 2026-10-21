import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import DeprecatedRedirect from '../components/common/DeprecatedRedirect';
import FEATURES from '../config/features';
import PublicTestnetLandingPage from '../pages/PublicTestnetLandingPage';
import { isFullStudioEnabled } from '../config/contractSurfacePolicy';

const NewDashboard = lazy(() => import('../components/Dashboard/NewDashboard'));
const WeatherContributorHome = lazy(() => import('../pages/WeatherContributorHome'));
const InfrastructureCapacityDashboard = lazy(() => import('../components/Dashboard/InfrastructureCapacityDashboard'));
const SmartContractsPage = lazy(() => import('../pages/SmartContractsPage'));
const ActivityFeed = lazy(() => import('../components/RealTime/ActivityFeed'));
const ConnectionStatusPanel = lazy(() => import('../components/RealTime/ConnectionStatus'));
const PermissionlessHealthIndicatorsPage = lazy(() => import('../pages/PermissionlessHealthIndicatorsPage'));
const TransparencyLedgerDashboardPage = lazy(() => import('../pages/TransparencyLedgerDashboardPage'));
const AlertRemediationDashboard = lazy(() => import('../pages/AlertRemediationDashboard'));

export default function dashboardRoutes() {
  const showWeatherContributorHome = isFullStudioEnabled(
    import.meta.env?.VITE_ENABLE_FULL_STUDIO,
  );

  return <>
    <Route
      path="/"
      element={
        <PageWrapper tabType="weather">
          {showWeatherContributorHome ? <WeatherContributorHome /> : <PublicTestnetLandingPage />}
        </PageWrapper>
      }
    />

    {/* Dashboard (moved from /) */}
    <Route path="/dashboard" element={<PageWrapper tabType="dashboard"><NewDashboard /></PageWrapper>} />
    <Route path="/dashboard/legacy" element={<DeprecatedRedirect to="/dashboard" />} />
    <Route path="/dashboard/optimized" element={<Navigate to="/dashboard" replace />} />

    {FEATURES.infrastructure && <Route path="/infrastructure" element={<PageWrapper tabType="dashboard"><InfrastructureCapacityDashboard /></PageWrapper>} />}
    {FEATURES.smartContracts && <Route path="/smart-contracts" element={<PageWrapper tabType="contracts"><SmartContractsPage /></PageWrapper>} />}
    {FEATURES.smartContracts && <Route path="/smart-contract-graph" element={<DeprecatedRedirect to="/smart-contracts" />} />}

    {/* Real-Time Streaming */}
    <Route path="/realtime/activity" element={<PageWrapper tabType="dashboard"><ActivityFeed /></PageWrapper>} />
    <Route path="/realtime/status" element={<PageWrapper tabType="dashboard"><ConnectionStatusPanel /></PageWrapper>} />

    {/* Resilience */}
    <Route path="/resilience/permissionless-health" element={<PageWrapper tabType="dashboard"><PermissionlessHealthIndicatorsPage /></PageWrapper>} />
    <Route path="/resilience/transparency-ledger" element={<PageWrapper tabType="dashboard"><TransparencyLedgerDashboardPage /></PageWrapper>} />

    {/* Alerts */}
    <Route path="/alerts/remediation" element={<PageWrapper tabType="dashboard"><AlertRemediationDashboard /></PageWrapper>} />
  </>;
}
