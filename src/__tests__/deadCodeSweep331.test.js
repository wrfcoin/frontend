/**
 * frontend#331 — dead code carrying fabricated data (no importer, or only
 * the unrouted routeMapper/AppRoutes/LazyLoader trio, or a barrel export
 * nobody consumed) is deleted so the "is this mock?" grep stays trustworthy.
 * Every path below was re-verified importer-free on main before deletion.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../', import.meta.url));

const DELETED = [
  'components/Dashboard/ComprehensiveDashboard.jsx',
  'components/Dashboard/archive',
  'components/Earnings/WeatherEarnings.jsx',
  'components/wallet/v2/SwapModal.jsx',
  'components/Staking/TokenizedVaultDemo.jsx',
  'components/CrossChain/NetworkStatus.jsx',
  'components/CrossChain/CrossChainAnalytics.jsx',
  'components/CrossChain/CrossChainBridge.jsx',
  'components/Explorer',
  'components/explorer/BlockchainExplorer.tsx',
  'components/developer/DeveloperPortal.jsx',
  'components/ComputeMarketplace/JobMonitor.jsx',
  'components/RealTime/RealTimeChart.jsx',
  'components/RealTime/SSEProvider.jsx',
  'components/DataExplorer',
  'components/FieldTools/FieldDataEntry.tsx',
  'components/IoTDashboard/DeviceRegistrationFlow.tsx',
  'components/ForecastViewer/mockData.ts',
  'components/SmartContractGraph',
  'utils/mockSmartContractData.ts',
  'utils/cryptoUtils.js',
  'utils/quantumWalletUtils.ts',
  'services/ApiConsolidationService.js',
  'services/routeMapper.ts',
  'services/routeIntegration.ts',
  'components/CortexAI/ZkPrivacyDashboard.jsx',
  'components/environmental/RealTimeDataFeed.jsx',
  'components/FairLaunch/StakeCalculator.jsx',
  'components/routes/AppRoutes.jsx',
  'components/LazyLoader.jsx',
  'node_os',
];

// Module specifiers that must no longer appear in any import/require/import().
const SPECIFIERS = [
  'Dashboard/ComprehensiveDashboard', 'Dashboard/archive', 'Earnings/WeatherEarnings', 'wallet/v2/SwapModal',
  'Staking/TokenizedVaultDemo', 'CrossChain/NetworkStatus', 'CrossChain/CrossChainAnalytics', 'CrossChain/CrossChainBridge\'',
  'components/Explorer/', 'explorer/BlockchainExplorer', 'developer/DeveloperPortal', 'ComputeMarketplace/JobMonitor',
  'RealTime/RealTimeChart', 'RealTime/SSEProvider', 'components/DataExplorer', 'FieldTools/FieldDataEntry',
  'IoTDashboard/DeviceRegistrationFlow', 'ForecastViewer/mockData', 'SmartContractGraph/', 'mockSmartContractData',
  'utils/cryptoUtils', 'quantumWalletUtils', 'ApiConsolidationService', 'routeMapper', 'routeIntegration',
  'CortexAI/ZkPrivacyDashboard', 'environmental/RealTimeDataFeed', 'FairLaunch/StakeCalculator', 'routes/AppRoutes',
  'components/LazyLoader', 'node_os/',
];

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (entry === 'node_modules' || entry === '__tests__') continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
};

describe('dead-code sweep (frontend#331)', () => {
  it.each(DELETED)('%s is gone', rel => {
    expect(existsSync(`${src}${rel}`)).toBe(false);
  });

  it('no remaining source file imports a deleted module', () => {
    const offenders = [];
    for (const file of walk(src.replace(/\/$/, ''))) {
      const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
      for (const spec of SPECIFIERS) {
        const re = new RegExp(`(from\\s*|import\\(|require\\()\\s*['"][^'"]*${spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
        if (re.test(text)) offenders.push(`${file.replace(src, '')} -> ${spec}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
