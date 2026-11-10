import { useSyncExternalStore } from 'react';
import { getAuthToken, subscribeAuthToken } from '../../services/authTokenStore';
import { tokenWallet } from '../../services/walletApi';
import { readSavedWallets, type SavedWallets, type WalletKind } from './WalletSwitcher';

/** What a person calls each kind of wallet, everywhere the site names one. */
export const WALLET_KIND_LABEL: Record<WalletKind, string> = { passkey: 'Passkey', phrase: '12-word' };
export const WALLET_KIND_NAME: Record<WalletKind, string> = { passkey: 'passkey wallet', phrase: '12-word wallet' };

export interface ActiveWallet {
  address: string;
  /** Which of this browser's saved wallets holds the session; 'other' when it is neither. */
  kind: WalletKind | 'other';
}

/**
 * The active wallet: the one the in-memory login token names (display only; the server checks the token).
 * Nothing is stored for it, so after a reload no wallet is active until one signs in again.
 */
export function activeWalletOf(token: string, saved: SavedWallets): ActiveWallet | null {
  const address = token ? tokenWallet(token) : null;
  if (!address) return null;
  if (saved.passkey && saved.passkey.toLowerCase() === address) return { address, kind: 'passkey' };
  if (saved.phrase && saved.phrase.toLowerCase() === address) return { address, kind: 'phrase' };
  return { address, kind: 'other' };
}

export function useActiveWallet(): ActiveWallet | null {
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  return activeWalletOf(token, readSavedWallets());
}
