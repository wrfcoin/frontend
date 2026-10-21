import React from 'react';
import { WrfEmptyState } from '../DesignSystem';

const PredictiveAnalytics: React.FC = () => (
  <WrfEmptyState
    variant="no-data"
    title="Predictive Analytics Unavailable"
    description="Predictive analytics will be displayed once sufficient historical data is collected."
  />
);

export default PredictiveAnalytics;
