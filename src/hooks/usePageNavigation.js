import { isCapabilityRouteAvailable } from '../config/capabilityRoutePolicy';
import { useLocation, useNavigate } from 'react-router';
import { useMemo, useCallback } from 'react';
import {
  filterPublicNavigation,
  isFullStudioEnabled,
  isOperatorPreviewEnabled,
} from '../config/contractSurfacePolicy';

const FULL_STUDIO_ENABLED = isFullStudioEnabled(import.meta.env?.VITE_ENABLE_FULL_STUDIO);
const OPERATOR_PREVIEW_ENABLED = isOperatorPreviewEnabled(
  import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW,
);

const NAVIGABLE_PAGES = filterPublicNavigation([
  { path: '/', title: 'Dashboard' },
  { path: '/wallet', title: 'Wallet' },
  { path: '/miner', title: 'Miner' },
  { path: '/weather/dashboard', title: 'Weather Hub' },
  { path: '/map', title: 'Weather Map' },
  { path: '/identity', title: 'Identity' },
  { path: '/explorer', title: 'Explorer' },
  { path: '/dag-explorer', title: 'DAG Visualizer' },
  { path: '/nfts/enhanced', title: 'NFT' },
  { path: '/resources', title: 'Resources' },
  { path: '/governance/comprehensive', title: 'Governance' },
  { path: '/bridge', title: 'Cross-Chain Bridge' },
  { path: '/forecast', title: 'Forecasts' },
  { path: '/pipelines', title: 'Data Pipelines' },
  { path: '/ai-marketplace', title: 'AI Models' },
  { path: '/carbon/reporting', title: 'Carbon Reporting' },
  { path: '/collaboration', title: 'Collaboration' },
  { path: '/compute', title: 'Compute Market' },
  { path: '/community', title: 'Community' },
  { path: '/leaderboard', title: 'Leaderboard' },
  { path: '/realtime/activity', title: 'Activity Feed' },
  { path: '/defi', title: 'DeFi Portfolio' },
  { path: '/network/fees', title: 'Network Fees' },
  { path: '/staking/liquid', title: 'Liquid Staking' },
  { path: '/infrastructure', title: 'Infrastructure' },
  { path: '/smart-contracts', title: 'Smart Contracts' },
  { path: '/IoT', title: 'IoT Dashboard' },
  { path: '/storage', title: 'Distributed Storage' },
  { path: '/messaging', title: 'Communication' },
  { path: '/analytics/unified', title: 'Analytics' },
  { path: '/integrations', title: 'Integrations Hub' },
  { path: '/sharding', title: 'Sharding' },
  { path: '/pop', title: 'Proof of Publishing' },
  { path: '/settings', title: 'Settings' },
  { path: '/system', title: 'System Monitor' },
  { path: '/validators', title: 'Validator Ops' },
  { path: '/network/topology', title: 'Network Insights' },
], FULL_STUDIO_ENABLED, OPERATOR_PREVIEW_ENABLED);

const usePageNavigation = (isFeatureEnabled = () => false) => {
  const pages = useMemo(() => NAVIGABLE_PAGES.filter(page => isCapabilityRouteAvailable(page.path, isFeatureEnabled)), [isFeatureEnabled]);
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = useMemo(() => {
    // Exact match
    const exactMatch = pages.findIndex(page => page.path === location.pathname);
    if (exactMatch !== -1) return exactMatch;

    // Strict prefix matching to avoid catching unrelated routes like '/settings/modules'
    const partialMatch = pages.findIndex(page =>
      location.pathname.startsWith(page.path + '/') && page.path !== '/',
    );
    return partialMatch !== -1 ? partialMatch : 0;
  }, [location.pathname, pages]);

  const prevPage = useMemo(() => {
    const prevIndex = currentIndex === 0 ? pages.length - 1 : currentIndex - 1;
    return pages[prevIndex];
  }, [currentIndex, pages]);

  const nextPage = useMemo(() => {
    const nextIndex = currentIndex === pages.length - 1 ? 0 : currentIndex + 1;
    return pages[nextIndex];
  }, [currentIndex, pages]);

  const currentPage = useMemo(() => {
    return pages[currentIndex];
  }, [currentIndex, pages]);

  const goToPrev = useCallback(() => {
    navigate(prevPage.path);
  }, [navigate, prevPage]);

  const goToNext = useCallback(() => {
    navigate(nextPage.path);
  }, [navigate, nextPage]);

  const goToIndex = useCallback((index) => {
    if (index >= 0 && index < pages.length) {
      navigate(pages[index].path);
    }
  }, [navigate, pages]);

  return {
    currentPage,
    prevPage,
    nextPage,
    goToPrev,
    goToNext,
    goToIndex,
    totalPages: pages.length,
    currentIndex: currentIndex, // 0-indexed for PageNavigator
  };
};

export default usePageNavigation;
