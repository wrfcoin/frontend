import React from 'react';
import PublicViewerNotice from '../common/PublicViewerNotice';
import { useProofOfMeme } from '../../hooks/useProofOfMeme';

export function ProofOfMemeDashboard({ walletAddress }) {
  const { error } = useProofOfMeme(walletAddress);
  return <PublicViewerNotice reason="not-live" title={error}
    description="The social rewards API is not served by the testnet. Reward multipliers and engagement totals are unknown." />;
}

export default ProofOfMemeDashboard;
