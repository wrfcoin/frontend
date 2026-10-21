import React from 'react';
import { WrfEmptyState } from '../DesignSystem';

interface MobileHSMSecurityDashboardProps {
  compact?: boolean;
  onSecurityAction?: (action: string) => void;
}

const MobileHSMSecurityDashboard: React.FC<MobileHSMSecurityDashboardProps> = () => (
  <WrfEmptyState
    variant="no-data"
    title="HSM Security Data Unavailable"
    description="HSM security status will be displayed once the hardware security module is connected."
  />
);

export default MobileHSMSecurityDashboard;
