import React from 'react';
import { Link } from 'react-router';
import { Box, Typography, Stack } from '@mui/material';
import {
  Hub as TopologyIcon,
  Speed as RelayIcon,
  DevicesOther as LightClientIcon,
  Inbox as MempoolIcon,
  Construction as PBSIcon,
  Sync as StateSyncIcon,
  SwapHoriz as P2PIcon,
} from '@mui/icons-material';
import { WrfCard } from '../DesignSystem';
import { WrfCapabilityReadinessBadge } from '../DesignSystem';
import { colors, spacing } from '../ui/tokens';

interface InsightCard {
  path: string;
  title: string;
  description: string;
  icon: React.ReactElement;
}

const INSIGHT_CARDS: InsightCard[] = [
  {
    path: '/network/topology',
    title: 'Network Topology',
    description: 'P2P network graph with regional node distribution and connectivity.',
    icon: <TopologyIcon />,
  },
  {
    path: '/network/relay',
    title: 'Compact Block Relay',
    description: 'Block relay performance metrics and propagation statistics.',
    icon: <RelayIcon />,
  },
  {
    path: '/network/light-clients',
    title: 'Light Clients',
    description: 'Light client synchronization status and header chain progress.',
    icon: <LightClientIcon />,
  },
  {
    path: '/network/mempool',
    title: 'Mempool Visualizer',
    description: 'Transaction pool fee distribution and pending transaction analysis.',
    icon: <MempoolIcon />,
  },
  {
    path: '/network/pbs',
    title: 'PBS Explorer',
    description: 'Proposer-Builder Separation analysis and MEV metrics.',
    icon: <PBSIcon />,
  },
  {
    path: '/network/state-sync',
    title: 'State Sync',
    description: 'Snapshot synchronization operations and state download progress.',
    icon: <StateSyncIcon />,
  },
  {
    path: '/network/p2p-sync',
    title: 'P2P Sync Orchestrator',
    description: 'Peer-to-peer synchronization coordination and block propagation.',
    icon: <P2PIcon />,
  },
];

const ExplorerInsightsPanel: React.FC = () => {
  return (
    <Box sx={{ p: `${spacing.lg}px` }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: `${spacing.md}px` }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text.primary }}>
          Network Insights
        </Typography>
        <WrfCapabilityReadinessBadge featureName="networkInsights" compact />
      </Stack>
      <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary, mb: `${spacing.lg}px` }}>
        Deep-dive into network infrastructure, consensus mechanics, and peer-to-peer coordination.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: `${spacing.md}px`,
        }}
      >
        {INSIGHT_CARDS.map((card) => (
          <Link key={card.path} to={card.path} style={{ textDecoration: 'none' }}>
            <WrfCard
              sx={{
                p: `${spacing.md}px`,
                height: '100%',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': {
                  borderColor: colors.brand.primary,
                  boxShadow: `0 0 0 1px ${colors.brand.primary}`,
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Box sx={{ color: colors.brand.primary, display: 'flex', fontSize: 22 }}>
                  {card.icon}
                </Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text.primary }}>
                  {card.title}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary, lineHeight: 1.5 }}>
                {card.description}
              </Typography>
            </WrfCard>
          </Link>
        ))}
      </Box>
    </Box>
  );
};

export default ExplorerInsightsPanel;
