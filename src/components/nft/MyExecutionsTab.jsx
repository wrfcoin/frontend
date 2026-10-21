/**
 * MyExecutionsTab Component
 *
 * Shows the user's computational NFT execution history.
 * No hardcoded stats, no fake hardware configs, no mock WRF earnings.
 * Execution history and resource data require backend endpoints not yet live for testnet.
 */

import React from 'react';
import { WrfCard, WrfBadge } from '../DesignSystem';

const MyExecutionsTab = () => (
  <div>
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '20px 0' }}>
      My Executions Dashboard
    </div>

    {/* Stats — no mock values */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
      {[
        { title: 'Active Jobs', value: '—' },
        { title: 'Total WRF Earned', value: '—' },
        { title: 'Resource Utilization', value: '—' },
      ].map(({ title, value }) => (
        <div key={title} style={{ flex: '1 1 calc(33.333% - 24px)', minWidth: '200px' }}>
          <WrfCard headerTitle={title}>
            <div style={{ color: '#94a3b8', fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0' }}>
              {value}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              No executions yet
            </div>
          </WrfCard>
        </div>
      ))}
    </div>

    {/* Execution History */}
    <WrfCard headerTitle="Execution History" sx={{ margin: '20px 0' }}>
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', margin: '0.5rem 0' }}>
          No executions yet
        </div>
        <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '8px' }}>
          Browse the marketplace to find computational NFTs to execute.
          Your completed jobs and WRF earnings will appear here.
        </div>
      </div>
    </WrfCard>
  </div>
);

export default MyExecutionsTab;
