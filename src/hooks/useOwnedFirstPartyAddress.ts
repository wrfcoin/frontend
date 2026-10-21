import { useOptionalWallet } from '../contexts/WalletContext.jsx';
import { walletProviderManager } from '../services/walletProviders/WalletProviderManager.js';

/**
 * The lowercase address of the visitor's own signed-in first-party wallet, or null.
 *
 * Same rule as the /wallet page (OwnWalletAddress, frontend#457): connected through the custom provider, able
 * to sign, and its ed25519 login identity is that very address. A receive-only, legacy or injected EVM account
 * never counts. Outside a WalletProvider it is null rather than an error.
 */
export function useOwnedFirstPartyAddress(): string | null {
  const wallet = useOptionalWallet() as {
    account?: unknown; activeProvider?: unknown; isConnected?: boolean; receiveOnly?: boolean;
  } | null;
  if (!wallet) return null;
  const { account, activeProvider, isConnected, receiveOnly } = wallet;
  if (!isConnected || activeProvider !== 'custom' || receiveOnly || typeof account !== 'string') return null;
  const identity = walletProviderManager.getLoginIdentity() as { scheme?: string; address?: string } | null;
  if (identity?.scheme !== 'ed25519' || typeof identity.address !== 'string') return null;
  if (identity.address.toLowerCase() !== account.toLowerCase()) return null;
  return account.toLowerCase();
}
