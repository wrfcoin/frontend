import React from 'react';
import PublicViewerNotice from '../common/PublicViewerNotice';

export default function NASStoragePage() {
  return <PublicViewerNotice reason="not-live" title="NAS storage is unavailable"
    description="The NAS storage API is not served by the testnet. Device discovery, registration, collector status and storage earnings are unavailable." />;
}
