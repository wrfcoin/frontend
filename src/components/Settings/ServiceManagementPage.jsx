import React from 'react';
import PublicViewerNotice from '../common/PublicViewerNotice';

export default function ServiceManagementPage() {
  return (
    <PublicViewerNotice
      reason="not-live"
      title="Service management is unavailable"
      description="The service-management API is not served by the testnet. Service status, earnings and power controls are unavailable."
    />
  );
}
