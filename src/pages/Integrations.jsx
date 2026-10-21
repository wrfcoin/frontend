import React from 'react';
import { WrfContainer } from '../components/DesignSystem';
import WorkflowManagerUI from '../components/WorkflowManagerUI';
import './Integrations.css';

const IntegrationsPage = () => {
  return (
    <div className="integrations-page">
      <div className="page-header">
        <h1>Wrfcoin Core Integrations</h1>
        <p className="subtitle">
          Manage blockchain components and optimize your development environment
        </p>
      </div>

      <WrfContainer>
        <WorkflowManagerUI />
      </WrfContainer>
    </div>
  );
};

export default IntegrationsPage;
