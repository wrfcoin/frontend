/**
 * Network configuration for the WRFCoin wallet surface.
 *
 * Centralizes testnet-truthful labels and the optional block-explorer URL so
 * wallet components never hard-code "Ethereum"/"Mainnet"/Etherscan. The
 * explorer URL is read from the environment; when it is not configured the UI
 * renders plain text instead of a (wrong) link.
 */

/** Human-readable name of the active WRFCoin network. */
export const NETWORK_NAME = 'WRFCoin Testnet';

/**
 * The WRFCoin chain id from the build (VITE_WRFCOIN_CHAIN_ID; the testnet image
 * passes 777), or null when the build sets none. Never a literal here: a wrong
 * constant made every wallet look like it was on the wrong network.
 */
export const WRFCOIN_CHAIN_ID: string | null = (() => {
  const raw = import.meta.env?.VITE_WRFCOIN_CHAIN_ID;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
})();

/** Native currency symbol used for balances and fees. */
export const NATIVE_SYMBOL = 'WRF';

/**
 * Base URL of the configured block explorer, or null when none is set.
 * Trailing slashes are trimmed so callers can safely append paths.
 */
export const EXPLORER_BASE_URL: string | null = (() => {
  const raw = (import.meta as any)?.env?.VITE_EXPLORER_URL;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : null;
})();

/** Whether a block explorer is configured for the active network. */
export const hasExplorer = (): boolean => EXPLORER_BASE_URL !== null;

/**
 * Build an explorer URL for a transaction hash, or null when no explorer is
 * configured (callers should then render the hash as plain text).
 */
export const explorerTxUrl = (hash: string): string | null => {
  if (!EXPLORER_BASE_URL || !hash) return null;
  return `${EXPLORER_BASE_URL}/tx/${hash}`;
};

/**
 * Build an explorer URL for an address, or null when no explorer is configured.
 */
export const explorerAddressUrl = (address: string): string | null => {
  if (!EXPLORER_BASE_URL || !address) return null;
  return `${EXPLORER_BASE_URL}/address/${address}`;
};
