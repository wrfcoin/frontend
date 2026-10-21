import React from 'react';
import { WrfEmptyState } from '../DesignSystem';

const PerformanceOptimizer: React.FC = () => (
  <WrfEmptyState
    variant="no-data"
    title="Performance Metrics Unavailable"
    description="Performance optimization data will be displayed once live system metrics are connected."
  />
);

export default PerformanceOptimizer;
