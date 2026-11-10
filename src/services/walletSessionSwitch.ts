/**
 * One session, one wallet (multi-wallet builds).
 *
 * The login token names a single wallet. Before a wallet of another kind signs in (today: the passkey
 * wallet), whatever wallet is unlocked in this tab is locked first, so the site never shows one wallet as
 * unlocked while the API is called as the other. This works against the provider manager itself, not a
 * mounted React provider, so it holds on every page. The provider stack is loaded on demand, which keeps
 * the auth service free of a static import of it.
 */

/**
 * The build flag, read at call time: exact "true" for both variables, the same rule as features.ts and the
 * taskbar (a test holds the three together). Read here directly so the auth service, which every page
 * loads, gains no import of the navigation or feature modules.
 */
export function multiWalletSessionRule(): boolean {
  return import.meta.env?.VITE_ENABLE_PASSKEY_WALLET === 'true' && import.meta.env?.VITE_ENABLE_MULTI_WALLET === 'true';
}

interface ProviderManager {
  getActiveProvider(): unknown;
  getLoginIdentity(): { address?: string } | null;
  disconnect(): Promise<unknown>;
}
type LoadManager = () => Promise<ProviderManager>;
const loadManager: LoadManager = async () =>
  (await import('./walletProviders/WalletProviderManager.js')).walletProviderManager as ProviderManager;

/** Lock whatever wallet is unlocked in this tab (no-op when none is). Used by sign-out and by a switch. */
export async function lockUnlockedWallet(load: LoadManager = loadManager): Promise<void> {
  const manager = await load();
  if (manager.getActiveProvider()) await manager.disconnect();
}

/**
 * Called by a login for `address` after its signature and before it is posted. In a multi-wallet build it
 * locks an unlocked wallet with a different address and answers true: the caller then drops the old session
 * before the new one can exist. Otherwise it does nothing and answers false.
 */
export async function beforeWalletLogin(address: string, load: LoadManager = loadManager): Promise<boolean> {
  if (!multiWalletSessionRule()) return false;
  const manager = await load();
  const own = manager.getLoginIdentity()?.address?.toLowerCase();
  if (manager.getActiveProvider() && own !== address.toLowerCase()) await manager.disconnect();
  return true;
}
