/**
 * MiningControlsPanel — what the browser can honestly say about contribution.
 *
 * frontend#355: this panel used to offer Start/Pause/Stop/Resume buttons that
 * changed only local state after an artificial delay. Nothing was sent
 * anywhere. Contribution on this chain comes from station collectors, not
 * from a browser session, so the panel shows the node status from the real
 * node-stats poll and points to station onboarding. There are no controls.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import { NODE_STATUS_LABEL } from './nodeStatus';

const NODE_STATUS_DETAIL = {
  online: 'The node answered its last statistics poll.',
  unreachable: 'The last node statistics poll failed.',
  unknown: 'Waiting for the first node statistics poll.',
};

const MiningControlsPanel = ({ nodeStatus = 'unknown' }) => (
  <div className="miner-card" data-testid="miner-contribution-panel">
    <div className="control-panel">
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: '500',
          color: 'rgba(232, 232, 240, 0.6)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Node status
      </div>
      <div
        data-testid="miner-panel-node-status"
        style={{ fontFamily: '\'JetBrains Mono\', monospace', fontSize: '0.875rem', color: '#E8E8F0' }}
      >
        {NODE_STATUS_LABEL[nodeStatus] ?? NODE_STATUS_LABEL.unknown}
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'rgba(232, 232, 240, 0.7)', margin: '4px 0 16px' }}>
        {NODE_STATUS_DETAIL[nodeStatus] ?? NODE_STATUS_DETAIL.unknown}
      </p>

      <p style={{ fontSize: '0.875rem', color: 'rgba(232, 232, 240, 0.85)', margin: '0 0 16px' }}>
        Contribution runs on your station collector. There is nothing to start or stop in the browser.
      </p>

      <Link to="/connect-station" className="control-btn primary" data-testid="miner-connect-station-link">
        <Cloud size={20} />
        Connect a weather station
      </Link>
    </div>
  </div>
);

export default MiningControlsPanel;
