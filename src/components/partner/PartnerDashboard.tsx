import React from 'react';
import { WrfEmptyState } from '../DesignSystem';

const PartnerDashboard: React.FC = () => (
  <WrfEmptyState
    variant="no-data"
    title="Partner Metrics Unavailable"
    description="Partner dashboard metrics will be displayed once the partner integration is active."
  />
);

export default PartnerDashboard;
