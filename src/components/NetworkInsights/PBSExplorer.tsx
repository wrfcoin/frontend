import React from 'react';
import { WrfEmptyState } from '../DesignSystem';

const PBSExplorer: React.FC = () => (
  <WrfEmptyState
    variant="no-data"
    title="PBS Data Unavailable"
    description="Proposer-builder separation data will be displayed once live network data is connected."
  />
);

export default PBSExplorer;
