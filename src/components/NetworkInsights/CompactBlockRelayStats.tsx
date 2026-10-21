import React from 'react';
import { WrfEmptyState } from '../DesignSystem';

const CompactBlockRelayStats: React.FC = () => (
  <WrfEmptyState
    variant="no-data"
    title="Block Relay Stats Unavailable"
    description="Block relay statistics will be displayed once live network data is connected."
  />
);

export default CompactBlockRelayStats;
