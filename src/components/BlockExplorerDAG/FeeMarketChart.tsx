import React from 'react';
import { WrfEmptyState } from '../DesignSystem';

const FeeMarketChart: React.FC = () => (
  <WrfEmptyState
    variant="no-data"
    title="Fee Market Data Unavailable"
    description="Fee market chart data will be displayed once live transaction data is connected."
  />
);

export default FeeMarketChart;
