import React from 'react';
import PublicViewerNotice from './common/PublicViewerNotice';

/**
 * No served source backs the former aggregate performance dashboard.
 * Keep its MobileApp navigation target, without polling unsupported routes
 * or displaying invented security, network, compliance and reward figures.
 */
export default function AdvancedPerformanceDashboard() {
  return (
    <section data-testid="advanced-performance-not-live">
      <PublicViewerNotice
        reason="not-live"
        title="Advanced performance data is unavailable"
        description="This dashboard will be available when its data source is connected."
      />
    </section>
  );
}
