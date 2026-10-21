import React, { useState, useEffect } from 'react';
import './IntegrationCards.css';

const AkashCard = () => {
  const [status, setStatus] = useState('connecting');
  const [deployments, setDeployments] = useState([]);
  const [resources, setResources] = useState({});

  useEffect(() => {
    // Simulate connection to Akash Network API
    const timer = setTimeout(() => {
      setStatus('connected');
      setDeployments([
        {
          id: 'deploy-12345',
          name: 'Weather Forecasting Model',
          status: 'active',
          uptime: '3d 14h',
          cpu: '8 vCPU',
          memory: '16 GB',
          storage: '50 GB',
        },
        {
          id: 'deploy-67890',
          name: 'Climate Simulation Worker',
          status: 'active',
          uptime: '1d 8h',
          cpu: '12 vCPU',
          memory: '32 GB',
          storage: '100 GB',
        },
        {
          id: 'deploy-24680',
          name: 'Air Quality Analytics',
          status: 'pending',
          uptime: '-',
          cpu: '4 vCPU',
          memory: '8 GB',
          storage: '20 GB',
        },
      ]);
      setResources({
        totalCpu: '24 vCPU',
        totalMemory: '56 GB',
        totalStorage: '170 GB',
        costPerDay: '8.72 AKT',
        estimatedMonthly: '261.6 AKT',
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="integration-card">
      <div className="integration-header">
        <h2>Akash Network Integration</h2>
        <div className={`status-indicator ${status}`}>
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && 'Connected'}
          {status === 'error' && 'Connection Error'}
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h3>Akash Deployments</h3>
          <p>
            Akash Network provides decentralized compute resources for Wrfcoin's
            computational tasks, including weather forecasting models, climate
            simulations, and air quality analysis.
          </p>

          <div className="deployments-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Uptime</th>
                  <th>Resources</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map(deployment => (
                  <tr key={deployment.id}>
                    <td>{deployment.name}</td>
                    <td>
                      <span className={`status-badge ${deployment.status}`}>
                        {deployment.status}
                      </span>
                    </td>
                    <td>{deployment.uptime}</td>
                    <td>{`${deployment.cpu}, ${deployment.memory}, ${deployment.storage}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="integration-section">
          <h3>Resource Utilization</h3>
          <div className="resource-cards">
            <div className="resource-card">
              <div className="resource-title">Total CPU</div>
              <div className="resource-value">{resources.totalCpu || '-'}</div>
            </div>
            <div className="resource-card">
              <div className="resource-title">Total Memory</div>
              <div className="resource-value">
                {resources.totalMemory || '-'}
              </div>
            </div>
            <div className="resource-card">
              <div className="resource-title">Total Storage</div>
              <div className="resource-value">
                {resources.totalStorage || '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="integration-section">
          <h3>Cost Analysis</h3>
          <div className="cost-analysis">
            <div className="cost-card">
              <div className="cost-title">Daily Cost</div>
              <div className="cost-value">{resources.costPerDay || '-'}</div>
            </div>
            <div className="cost-card">
              <div className="cost-title">Estimated Monthly</div>
              <div className="cost-value">
                {resources.estimatedMonthly || '-'}
              </div>
            </div>
          </div>
          <p className="cost-note">
            Costs are estimated based on current Akash Network market rates and
            may vary based on actual resource utilization and network demand.
          </p>
        </div>
      </div>

      <div className="integration-footer">
        <p>
          Akash Network provides decentralized compute resources for Wrfcoin's
          computational NFTs and meteorological calculations with pay-as-you-go
          pricing.
        </p>
      </div>
    </div>
  );
};

export default AkashCard;
