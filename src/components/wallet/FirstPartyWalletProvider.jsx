import React, { useEffect, useState } from 'react';
import { WalletProvider } from '../../contexts/WalletContext.jsx';
import { clearActiveProvider, getActiveProvider } from '../../services/secureWalletStorage';

/** The web join path uses the WRFCoin key, never an injected EVM wallet. */
export default function FirstPartyWalletProvider({ children }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (getActiveProvider() !== 'custom') clearActiveProvider();
    setReady(true);
  }, []);
  return ready ? <WalletProvider passive={false}>{children}</WalletProvider> : <p>Loading wallet…</p>;
}
