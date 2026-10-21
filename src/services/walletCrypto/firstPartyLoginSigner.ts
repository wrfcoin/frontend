import { bytesToHex, type FirstPartyAccount } from './firstPartyKeys';
import {
  assertEd25519LoginChallenge,
  resolveEd25519LoginExpectations,
  type Ed25519LoginExpectations,
} from './loginChallenge';

/**
 * Login signer for an in-memory first-party ed25519 account (e.g. the fresh
 * wallet ConnectStationPage creates). The same key authorizes transfers, so
 * this re-validates the server bytes independently of
 * WalletAuthService.loginWithEd25519 — as CustomWalletProvider
 * .signLoginChallenge does — and refuses anything that is not an ed25519 login
 * challenge for THIS address, origin, chain and network, before the key is
 * touched. It never falls back to signing arbitrary text.
 *
 * Without explicit expectations the origin/chain/network come from the
 * VITE_* config (resolveEd25519LoginExpectations); missing config fails closed.
 */
export function ed25519LoginSigner(
  account: FirstPartyAccount,
  expectations?: Omit<Ed25519LoginExpectations, 'address' | 'nonce'>,
): (message: string) => string {
  const address = account.address.toLowerCase();
  return (message: string): string => {
    const challenge = assertEd25519LoginChallenge(
      message,
      expectations
        ? { ...expectations, address }
        : resolveEd25519LoginExpectations(address),
    );
    return bytesToHex(account.sign(new TextEncoder().encode(challenge)));
  };
}
