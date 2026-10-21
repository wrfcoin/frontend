import React from 'react';
import { Route } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import DeprecatedRedirect from '../components/common/DeprecatedRedirect';
import FEATURES from '../config/features';

// Resources & Developer
const Resources = lazy(() => import('../components/Resources/Resources'));
const WikiDocs = lazy(() => import('../components/Resources/WikiDocs'));
const DeveloperPortal = lazy(() => import('../pages/DeveloperPortal'));
const PublicPolicyPage = lazy(() => import('../pages/PublicPolicyPage'));
const PublicDownloadsPage = lazy(() => import('../pages/PublicDownloadsPage'));

// Integrations
const IntegrationsHub = lazy(() => import('../components/Integrations/IntegrationsHub'));
const AIIntegrationsHub = lazy(() => import('../components/Integrations/AIIntegrationsHub'));
const WeatherDataSharingPage = lazy(() => import('../components/Integrations/WeatherDataSharingPage'));
const N8nConfig = lazy(() => import('../components/Integrations/N8nConfig'));
const StoryProtocolIntegration = lazy(() => import('../components/Integrations/StoryProtocol/StoryProtocolIntegration'));
const AIPluginsHub = lazy(() => import('../components/Integrations/AIPluginsHub'));
const BacalhauPanel = lazy(() => import('../components/Integrations/BacalhauPanel'));
const DataDeviceIntegrationsHub = lazy(() => import('../components/Integrations/DataDeviceIntegrationsHub'));
const FilecoinPanel = lazy(() => import('../components/Integrations/FilecoinPanel'));
const HeliumNetworkPanel = lazy(() => import('../components/Integrations/HeliumNetworkPanel'));
const SonmCard = lazy(() => import('../components/Integrations/SonmCard'));
const EnhancedIntegrationsHub = lazy(() => import('../components/Integrations/EnhancedIntegrationsHub'));
const IntegrationsEnhancedPage = lazy(() => import('../pages/IntegrationsEnhancedPage'));
const LuftdatenDashboard = lazy(() => import('../components/Luftdaten/LuftdatenDashboard'));
const IExecDashboard = lazy(() => import('../components/iExec/iExecDashboard'));
const TatauCloudDashboard = lazy(() => import('../components/TatauCloud/TatauCloudDashboard'));
const GolemDashboard = lazy(() => import('../components/Golem/GolemDashboard'));
const EasyOnboardingSection = lazy(() => import('../components/Integrations/EasyOnboardingSection'));

// System & Debug
const SystemMonitor = lazy(() => import('../components/System/SystemMonitor'));
const DebugPage = lazy(() => import('../components/Debug/DebugPage'));
const WebSocketDemo = lazy(() => import('../components/WebSocket/WebSocketDemo'));
const MCPDashboard = lazy(() => import('../components/ModelContext/MCPDashboard'));
const NodeOSDashboard = lazy(() => import('../components/NodeOS/NodeOSDashboard'));

// Oracle & Sharding
// OracleDashboard is statically imported by TabContent.jsx so lazy() here
// would be pointless and causes a Rollup mixed-import warning.
import OracleDashboard from '../components/Oracle/OracleDashboard';
const ShardingDashboard = lazy(() => import('../components/ShardingDashboard/ShardingDashboard'));

// IoT
const IoTDashboard = lazy(() => import('../components/IoT/IoTDashboard'));
const IoTeXPage = lazy(() => import('../pages/IoTeXPage'));
const SensorCommunityPage = lazy(() => import('../components/SensorCommunity/SensorCommunityPage'));

// Other
const EnhancedIncentives = lazy(() => import('../pages/EnhancedIncentives'));
const CortexAIIntegration = lazy(() => import('../components/CortexAI/CortexAIIntegration'));
const DistributedStorageInterface = lazy(() => import('../components/Storage/DistributedStorageInterface'));
const MobileApp = lazy(() => import('../components/Mobile/MobileApp'));
const UnifiedAnalyticsDashboard = lazy(() => import('../components/UnifiedAnalytics/UnifiedAnalyticsDashboard'));
const PartnerDashboard = lazy(() => import('../components/partner/PartnerDashboard'));
const BlockchainSecurityPanel = lazy(() => import('../components/Communication/BlockchainSecurityPanel'));
const AdvancedPerformanceDashboard = lazy(() => import('../components/AdvancedPerformanceDashboard'));
const NetworkHealthMonitor = lazy(() => import('../components/Analytics/NetworkHealthMonitor'));
const CarbonTrackingDashboard = lazy(() => import('../components/CarbonTracking/CarbonTrackingDashboard'));

export default function platformRoutes() {
  return <>
    {/* Resources */}
    <Route path="/resources" element={<PageWrapper tabType="resources"><Resources /></PageWrapper>} />
    <Route path="/resources/wiki" element={<PageWrapper tabType="resources"><WikiDocs /></PageWrapper>} />
    {FEATURES.developer && <Route path="/developer" element={<PageWrapper tabType="resources"><DeveloperPortal /></PageWrapper>} />}
    <Route path="/terms" element={<PageWrapper tabType="resources"><PublicPolicyPage /></PageWrapper>} />
    <Route path="/privacy" element={<PageWrapper tabType="resources"><PublicPolicyPage /></PageWrapper>} />
    <Route path="/api-terms" element={<PageWrapper tabType="resources"><PublicPolicyPage /></PageWrapper>} />
    <Route path="/security" element={<PageWrapper tabType="resources"><PublicPolicyPage /></PageWrapper>} />
    <Route path="/downloads" element={<PageWrapper tabType="resources"><PublicDownloadsPage /></PageWrapper>} />

    {/* Standards redirects */}
    <Route path="/standards" element={<DeprecatedRedirect to="/resources" />} />
    <Route path="/standards/*" element={<DeprecatedRedirect to="/resources" />} />

    {/* Integrations */}
    {FEATURES.integrations && <>
      <Route path="/integrations" element={<PageWrapper tabType="integrations"><IntegrationsHub /></PageWrapper>} />
      <Route path="/integrations/ai/*" element={<PageWrapper tabType="integrations"><AIIntegrationsHub /></PageWrapper>} />
      <Route path="/integrations/share" element={<PageWrapper tabType="integrations"><WeatherDataSharingPage /></PageWrapper>} />
      <Route path="/integrations/workflows" element={<PageWrapper tabType="integrations"><N8nConfig /></PageWrapper>} />
      <Route path="/integrations/story-protocol" element={<PageWrapper tabType="integrations"><StoryProtocolIntegration /></PageWrapper>} />
      <Route path="/integrations/ai-plugins" element={<PageWrapper tabType="integrations"><AIPluginsHub /></PageWrapper>} />
      <Route path="/integrations/bacalhau" element={<PageWrapper tabType="integrations"><BacalhauPanel /></PageWrapper>} />
      <Route path="/integrations/devices" element={<PageWrapper tabType="integrations"><DataDeviceIntegrationsHub /></PageWrapper>} />
      <Route path="/integrations/filecoin" element={<PageWrapper tabType="integrations"><FilecoinPanel /></PageWrapper>} />
      <Route path="/integrations/helium" element={<PageWrapper tabType="integrations"><HeliumNetworkPanel /></PageWrapper>} />
      <Route path="/integrations/sonm" element={<PageWrapper tabType="integrations"><SonmCard /></PageWrapper>} />
      <Route path="/integrations/enhanced" element={<PageWrapper tabType="integrations"><EnhancedIntegrationsHub /></PageWrapper>} />
      <Route path="/integrations-enhanced" element={<PageWrapper tabType="settings"><IntegrationsEnhancedPage /></PageWrapper>} />
      <Route path="/integrations/luftdaten" element={<PageWrapper tabType="integrations"><LuftdatenDashboard /></PageWrapper>} />
      <Route path="/integrations/iexec" element={<PageWrapper tabType="integrations"><IExecDashboard /></PageWrapper>} />
      <Route path="/integrations/tatau" element={<PageWrapper tabType="integrations"><TatauCloudDashboard /></PageWrapper>} />
      <Route path="/integrations/golem" element={<PageWrapper tabType="integrations"><GolemDashboard /></PageWrapper>} />
    </>}

    {/* Oracle */}
    {FEATURES.oracle && <Route path="/oracle/dashboard" element={<PageWrapper tabType="oracle"><OracleDashboard /></PageWrapper>} />}

    {/* Node OS */}
    {FEATURES.system && <Route path="/node-os" element={<PageWrapper tabType="nodes"><NodeOSDashboard /></PageWrapper>} />}

    {/* Sharding */}
    {FEATURES.sharding && <Route path="/sharding" element={<PageWrapper tabType="sharding"><ShardingDashboard /></PageWrapper>} />}

    {/* Incentives */}
    {FEATURES.incentives && <Route path="/incentives" element={<PageWrapper tabType="incentives"><EnhancedIncentives /></PageWrapper>} />}

    {/* Partners */}
    {FEATURES.partners && <Route path="/partners" element={<PageWrapper tabType="partners"><PartnerDashboard /></PageWrapper>} />}

    {/* IoT */}
    {FEATURES.iot && <>
      <Route path="/IoT" element={<PageWrapper tabType="iot"><IoTDashboard /></PageWrapper>} />
      <Route path="/iotex" element={<PageWrapper tabType="iotex"><IoTeXPage /></PageWrapper>} />
      <Route path="/sensor-community" element={<PageWrapper tabType="sensor"><SensorCommunityPage /></PageWrapper>} />
    </>}

    {/* Storage */}
    {FEATURES.storage && <Route path="/storage" element={<PageWrapper tabType="storage"><DistributedStorageInterface /></PageWrapper>} />}

    {/* AI/ML */}
    {FEATURES.cortex && <Route path="/cortex" element={<PageWrapper tabType="cortex"><CortexAIIntegration /></PageWrapper>} />}

    {/* System */}
    {FEATURES.system && <>
      <Route path="/system" element={<PageWrapper tabType="system"><SystemMonitor /></PageWrapper>} />
      <Route path="/mcp" element={<PageWrapper tabType="mcp"><MCPDashboard /></PageWrapper>} />
      <Route path="/security/blockchain" element={<PageWrapper tabType="security"><BlockchainSecurityPanel /></PageWrapper>} />
    </>}

    {/* Developer & Debug */}
    {FEATURES.developer && <>
      <Route path="/debug" element={<PageWrapper tabType="debug"><DebugPage /></PageWrapper>} />
      <Route path="/websocket-demo" element={<PageWrapper tabType="demo"><WebSocketDemo /></PageWrapper>} />
    </>}

    {/* Analytics */}
    {FEATURES.analytics && <Route path="/analytics/unified" element={<PageWrapper tabType="analytics"><UnifiedAnalyticsDashboard /></PageWrapper>} />}

    {/* Mobile */}
    {FEATURES.mobile && <>
      <Route path="/mobile-onboarding" element={<PageWrapper tabType="onboarding"><EasyOnboardingSection /></PageWrapper>} />
      <Route path="/mobile" element={<PageWrapper tabType="mobile"><MobileApp /></PageWrapper>} />
    </>}
  </>;
}
