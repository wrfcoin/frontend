/**
 * MobileBottomNav - Fixed bottom navigation for mobile devices
 *
 * frontend#355: the former Start/Stop item toggled local state only. The first
 * slot now reports the real node status and controls nothing.
 */

import React from 'react';
import { Activity, BarChart2, Settings, Cpu } from 'lucide-react';

const NODE_STATUS_SHORT = {
  online: 'Online',
  unreachable: 'Offline',
  unknown: 'Unknown',
};

const MobileBottomNav = ({ nodeStatus = 'unknown' }) => (
  <nav className="miner-bottom-nav" style={{ flexWrap: 'wrap', height: 'auto', padding: '8px 16px' }}>
    <div
      className={`nav-item ${nodeStatus === 'online' ? 'active' : ''}`}
      role="status"
      data-testid="miner-mobile-node-status"
    >
      <div className="nav-icon">
        <Activity size={22} />
      </div>
      <span>{NODE_STATUS_SHORT[nodeStatus] ?? NODE_STATUS_SHORT.unknown}</span>
    </div>

    <button type="button" className="nav-item" disabled aria-describedby="miner-navigation-unavailable">
      <div className="nav-icon">
        <Cpu size={22} />
      </div>
      <span>Hardware</span>
    </button>

    <button type="button" className="nav-item" disabled aria-describedby="miner-navigation-unavailable">
      <div className="nav-icon">
        <BarChart2 size={22} />
      </div>
      <span>Stats</span>
    </button>

    <button type="button" className="nav-item" disabled aria-describedby="miner-navigation-unavailable">
      <div className="nav-icon">
        <Settings size={22} />
      </div>
      <span>Settings</span>
    </button>
    <p id="miner-navigation-unavailable" style={{ flexBasis: '100%', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>
      Quick section navigation is unavailable. Use the page sections above.
    </p>
  </nav>
);

export default MobileBottomNav;
