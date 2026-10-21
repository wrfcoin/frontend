import React from 'react';
import PublicViewerNotice from '../common/PublicViewerNotice';

// Backend main has no activity-feed family. An empty feed would imply a
// successful read; show its unavailable state without creating a poll loop.
export default function ActivityFeed() {
  return (
    <PublicViewerNotice
      reason="not-live"
      title="Activity feed is unavailable"
      description="The activity API is not served by the testnet. No activity history has been read."
    />
  );
}
