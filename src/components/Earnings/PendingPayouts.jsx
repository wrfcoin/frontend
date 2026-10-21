import React from 'react';
import PublicViewerNotice from '../common/PublicViewerNotice';

export default function PendingPayouts() {
  return <PublicViewerNotice reason="not-live" title="Pending rewards are unavailable"
    description="The testnet does not serve pending reward claims. Claimable amounts and payout controls are unavailable." />;
}
