import React, { lazy, Suspense, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Box, Tabs, Tab, CircularProgress, Stack, Typography } from '@mui/material';
import {
  Layers as BlocksIcon,
  AccountTree as DAGIcon,
  Hub as NetworkIcon,
  Polyline as TopologyIcon,
  Insights as InsightsIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { colors, borderRadius } from '../ui/tokens';
import { WrfCapabilityReadinessBadge } from '../DesignSystem';
import { useFeatureEnabled } from '../../config/features';

// Lazy-loaded tab panels
const DAGExplorer = lazy(() => import('../DAGExplorer/DAGExplorer'));
const DAGBlockExplorer = lazy(() => import('../BlockExplorerDAG/DAGBlockExplorer'));
const NetworkTopology = lazy(() => import('../DAGExplorer/NetworkTopology'));
const ExplorerInsightsPanel = lazy(() => import('./ExplorerInsightsPanel'));
const ExplorerMap = lazy(() => import('./ExplorerMap'));

const BASE_TAB_KEYS = ['blocks', 'dag', 'network', 'topology', 'map'] as const;
const ALL_TAB_KEYS = ['blocks', 'dag', 'network', 'topology', 'map', 'insights'] as const;
type TabKey = (typeof ALL_TAB_KEYS)[number];

interface TabMeta {
  key: TabKey;
  label: string;
  icon: React.ReactElement;
}

const BASE_TAB_META: TabMeta[] = [
  { key: 'blocks', label: 'Block Explorer', icon: <BlocksIcon sx={{ fontSize: 18 }} /> },
  { key: 'dag', label: 'DAG View', icon: <DAGIcon sx={{ fontSize: 18 }} /> },
  { key: 'network', label: 'Network', icon: <NetworkIcon sx={{ fontSize: 18 }} /> },
  { key: 'topology', label: 'Topology', icon: <TopologyIcon sx={{ fontSize: 18 }} /> },
  { key: 'map', label: 'Map', icon: <MapIcon sx={{ fontSize: 18 }} /> },
];

const INSIGHTS_TAB: TabMeta = {
  key: 'insights',
  label: 'Network Insights',
  icon: <InsightsIcon sx={{ fontSize: 18 }} />,
};

function resolveTab(raw: string | null, validKeys: readonly string[]): TabKey {
  if (raw && validKeys.includes(raw)) return raw as TabKey;
  return 'blocks';
}

const Loading: React.FC = () => (
  <Stack alignItems="center" justifyContent="center" sx={{ height: '60vh' }}>
    <CircularProgress size={36} sx={{ color: colors.brand.primary }} />
  </Stack>
);

const NetworkExplorer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const networkInsightsEnabled = useFeatureEnabled('networkInsights');
  const explorerMapEnabled = useFeatureEnabled('explorerMap');

  const tabMeta = useMemo(() => {
    let tabs = explorerMapEnabled
      ? BASE_TAB_META
      : BASE_TAB_META.filter((t) => t.key !== 'map');
    if (networkInsightsEnabled) tabs = [...tabs, INSIGHTS_TAB];
    return tabs;
  }, [networkInsightsEnabled, explorerMapEnabled]);

  const validKeys = useMemo(() => tabMeta.map((t) => t.key), [tabMeta]);
  const activeTab = useMemo(() => resolveTab(searchParams.get('tab'), validKeys), [searchParams, validKeys]);

  const handleTabChange = (_: React.SyntheticEvent, value: TabKey) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'blocks') {
      next.delete('tab');
    } else {
      next.set('tab', value);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: colors.bg.primary,
        color: colors.text.primary,
      }}
    >
      {/* Page header */}
      <Box sx={{ px: 3, pt: 2, pb: 1, bgcolor: colors.bg.secondary }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: colors.text.primary }}>
            Explore
          </Typography>
          <WrfCapabilityReadinessBadge featureName="explorer" compact />
        </Stack>
      </Box>

      {/* Tab bar */}
      <Box
        sx={{
          bgcolor: colors.bg.secondary,
          borderBottom: `1px solid ${colors.border.default}`,
          px: 2,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              color: colors.text.secondary,
              fontSize: 13,
              fontWeight: 500,
              minHeight: 44,
              textTransform: 'none',
              px: 2,
            },
            '& .Mui-selected': { color: colors.brand.primary },
            '& .MuiTabs-indicator': { backgroundColor: colors.brand.primary, height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          {tabMeta.map(({ key, label, icon }) => (
            <Tab key={key} value={key} icon={icon} iconPosition="start" label={label} />
          ))}
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Suspense fallback={<Loading />}>
          {activeTab === 'blocks' && <DAGBlockExplorer />}
          {activeTab === 'dag' && <DAGExplorer />}
          {activeTab === 'network' && <DAGBlockExplorer />}
          {activeTab === 'topology' && <NetworkTopology />}
          {activeTab === 'map' && <ExplorerMap />}
          {activeTab === 'insights' && <ExplorerInsightsPanel />}
        </Suspense>
      </Box>
    </Box>
  );
};

export default NetworkExplorer;
