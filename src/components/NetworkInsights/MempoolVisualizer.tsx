import React from 'react';
import { WrfEmptyState } from '../DesignSystem';

const MempoolVisualizer: React.FC = () => (
  <WrfEmptyState
    variant="no-data"
    title="Mempool Data Unavailable"
    description="Mempool transaction data will be displayed once the live network is connected."
  />
);

export default MempoolVisualizer;
