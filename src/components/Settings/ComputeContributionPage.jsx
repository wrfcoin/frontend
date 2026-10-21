import React from 'react';
import PublicViewerNotice from '../common/PublicViewerNotice';

export default function ComputeContributionPage() {
  return <PublicViewerNotice reason="not-live" title="Compute contribution is unavailable"
    description="The compute contribution API is not served by the testnet. Node registration, tasks, status and compute earnings are unavailable." />;
}
