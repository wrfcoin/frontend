/**
 * One session, one wallet.
 *
 * The login token names a single wallet. Before a wallet of another kind signs in (today: the passkey wallet),
 * whatever wallet is unlocked in this tab is locked and its session dropped first, so the site never shows one
 * wallet as unlocked while the API is called as the other. The wallet context registers the handler; this
 * module only carries it, so the auth service does not import the provider stack.
 */
type BeforeLogin = (address: string) => Promise<void> | void;

let handler: BeforeLogin | null = null;

/** Register the handler (wallet context, multi-wallet builds). Returns the function that removes it. */
export function onBeforeWalletLogin(next: BeforeLogin): () => void {
  handler = next;
  return () => { if (handler === next) handler = null; };
}

/** Called by a login for `address` before it asks for any signature. Without a handler it does nothing. */
export async function beforeWalletLogin(address: string): Promise<void> {
  if (handler) await handler(address.toLowerCase());
}
