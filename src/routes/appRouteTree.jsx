import { Route } from 'react-router-dom';
import NotFound from '../components/common/NotFound';
import {
  dashboardRoutes,
  walletRoutes,
  miningRoutes,
  nftRoutes,
  governanceRoutes,
  weatherRoutes,
  networkRoutes,
  settingsRoutes,
  defiRoutes,
  identityRoutes,
  communityRoutes,
  platformRoutes,
  earnRoutes,
} from './index';

/**
 * The full, unfiltered route tree App.jsx mounts. It is kept here (not inline
 * in App.jsx) so tests can run the exact same tree through the public-route
 * filter and pin which paths each build flag combination exposes.
 */
export function appRouteElements({ validatorOpsEnabled, networkInsightsEnabled, isFeatureEnabled = () => false }) {
  return [
    // frontend#306: the former multi-tab interface route was removed — all
    // seven of its tabs resolved to a styled placeholder with a fake URL;
    // none of the target components existed.
    dashboardRoutes(),
    walletRoutes(),
    miningRoutes(),
    nftRoutes(),
    governanceRoutes(),
    weatherRoutes({ isFeatureEnabled }),
    networkRoutes({ validatorOpsEnabled, networkInsightsEnabled, isFeatureEnabled }),
    settingsRoutes({ isFeatureEnabled }),
    defiRoutes(),
    identityRoutes({ isFeatureEnabled }),
    communityRoutes({ isFeatureEnabled }),
    platformRoutes({ isFeatureEnabled }),
    earnRoutes(),
    <Route key="not-found" path="*" element={<NotFound />} />,
  ];
}
