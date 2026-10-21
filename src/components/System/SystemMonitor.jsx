import React, { useState } from 'react';
import DebugPage from '../Debug/DebugPage';
import NetworkHealthMonitor from '../Analytics/NetworkHealthMonitor';
import PageTitle from '../common/PageTitle';
import './SystemMonitor.css';

/**
 * System Monitor Component
 *
 * Combines System Diagnostics and Network Health monitoring
 * into a single tabbed interface.
 */
const SystemMonitor = () => {
  const [activeTab, setActiveTab] = useState('diagnostics');

  return (
    <div className="system-monitor">
      <PageTitle
        title="System Monitor"
        subtitle={
          activeTab === 'diagnostics'
            ? 'System Diagnostics & Troubleshooting'
            : 'Network Health & Performance'
        }
      />

      <div className="tab-navigation">
        <div
          className={`tab-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          <i className="bi bi-bug"></i>
          <span>System Diagnostics</span>
        </div>
        <div
          className={`tab-item ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <i className="bi bi-activity"></i>
          <span>Network Health</span>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'diagnostics' && <DebugPage />}
        {activeTab === 'network' && <NetworkHealthMonitor />}
      </div>
    </div>
  );
};

export default SystemMonitor;
