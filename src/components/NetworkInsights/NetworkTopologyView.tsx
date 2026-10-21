import React from 'react';
import L2ReadinessPanel from './L2ReadinessPanel';
import NetworkTopologyMap from './NetworkTopologyMap';

const NetworkTopologyView: React.FC = () => (
  <>
    <L2ReadinessPanel />
    <NetworkTopologyMap />
  </>
);

export default NetworkTopologyView;
