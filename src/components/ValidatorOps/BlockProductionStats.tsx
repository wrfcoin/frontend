import React from 'react';
import { WrfEmptyState } from '../DesignSystem';

const BlockProductionStats: React.FC = () => (
  <WrfEmptyState
    variant="no-data"
    title="Block Production Stats Unavailable"
    description="Block production statistics will be displayed once the validator network is active."
  />
);

export default BlockProductionStats;
