import React, { useEffect, useState } from 'react';
import FirstPartyWalletProvider from './FirstPartyWalletProvider';
import { clearActiveProvider } from '../../services/secureWalletStorage';
import { clearWalletAuthSession } from '../../services/walletAuthService';
import { walletProviderManager } from '../../services/walletProviders/WalletProviderManager.js';
import { walletManager } from '../../utils/walletUtils';

/** Require an explicit vault unlock on every entry to public onboarding. */
export default function PublicWalletSetupProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    clearActiveProvider();
    clearWalletAuthSession();
    walletManager.lockWallet();
    // Discard only the transient signing material. Keep the encrypted vault
    // and legacy local records so recovery/legacy notices remain available.
    for (const key of ['wrfcoin_wallet_secure', 'wrfcoin_wallet_imported_secure', 'wrfcoin_wallet_session_secret']) {
      sessionStorage.removeItem(key);
    }
    walletProviderManager.disconnect().then(() => {
      if (!cancelled) setReady(true);
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => { cancelled = true; };
  }, []);
  if (error) return <p role="alert">Unable to lock the previous wallet session. Reload before unlocking.</p>;
  return ready ? <FirstPartyWalletProvider>{children}</FirstPartyWalletProvider> : <p>Locking wallet…</p>;
}
