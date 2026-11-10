// One session, one wallet: before another wallet signs in, the wallet unlocked in this tab is locked through
// the provider manager itself (no mounted React provider needed). Off unless the build is multi-wallet.
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { beforeWalletLogin, lockUnlockedWallet, multiWalletSessionRule } from '../walletSessionSwitch';

const ON = { VITE_ENABLE_PASSKEY_WALLET: 'true', VITE_ENABLE_MULTI_WALLET: 'true' };
const setEnv = (env: Record<string, string> | undefined) => { (globalThis as { __VITE_ENV__?: unknown }).__VITE_ENV__ = env; };
const manager = (identity: string | null) => {
  const state = { active: identity !== null };
  return {
    state,
    disconnect: jest.fn(async () => { state.active = false; return true; }),
    getActiveProvider: () => (state.active ? {} : null),
    getLoginIdentity: () => (state.active && identity ? { address: identity } : null),
  };
};
afterEach(() => setEnv(undefined));

describe('walletSessionSwitch', () => {
  it('the rule is on only for exact "true" on both flags', () => {
    setEnv(ON); expect(multiWalletSessionRule()).toBe(true);
    setEnv({ VITE_ENABLE_PASSKEY_WALLET: 'true' }); expect(multiWalletSessionRule()).toBe(false);
    setEnv({ VITE_ENABLE_MULTI_WALLET: 'true' }); expect(multiWalletSessionRule()).toBe(false);
    setEnv(undefined); expect(multiWalletSessionRule()).toBe(false);
  });

  it('agrees with the taskbar rule for every combination', async () => {
    const { isMultiWalletEnabled } = await import('../../config/publicNavigation');
    for (const passkey of ['true', 'false', '1', undefined]) {
      for (const multi of ['true', 'false', 'TRUE', undefined]) {
        const env: Record<string, string> = {};
        if (passkey !== undefined) env.VITE_ENABLE_PASSKEY_WALLET = passkey;
        if (multi !== undefined) env.VITE_ENABLE_MULTI_WALLET = multi;
        setEnv(env);
        expect(multiWalletSessionRule()).toBe(isMultiWalletEnabled(passkey, multi));
      }
    }
  });

  it('flag off: does nothing, never loads the provider stack, answers false', async () => {
    const load = jest.fn(async () => manager('0xaa'));
    await expect(beforeWalletLogin('0xbb', load)).resolves.toBe(false);
    expect(load).not.toHaveBeenCalled();
  });

  it('flag on: another wallet signing in locks the unlocked wallet', async () => {
    setEnv(ON);
    const m = manager('0xAA');
    await expect(beforeWalletLogin('0xbb', async () => m)).resolves.toBe(true);
    expect(m.disconnect).toHaveBeenCalledTimes(1);
    expect(m.getActiveProvider()).toBeNull();
  });

  it('flag on: the same wallet signing in again stays unlocked (address compared without case)', async () => {
    setEnv(ON);
    const m = manager('0xAA');
    await expect(beforeWalletLogin('0xaa', async () => m)).resolves.toBe(true);
    expect(m.disconnect).not.toHaveBeenCalled();
  });

  it('flag on, nothing unlocked: nothing to lock', async () => {
    setEnv(ON);
    const m = manager(null);
    await expect(beforeWalletLogin('0xbb', async () => m)).resolves.toBe(true);
    expect(m.disconnect).not.toHaveBeenCalled();
  });

  it('a wallet that cannot be locked stops the login', async () => {
    setEnv(ON);
    const m = manager('0xaa');
    m.disconnect.mockRejectedValueOnce(new Error('could not lock'));
    await expect(beforeWalletLogin('0xbb', async () => m)).rejects.toThrow('could not lock');
  });

  it('lockUnlockedWallet locks an unlocked wallet and is a no-op otherwise', async () => {
    const unlocked = manager('0xaa');
    await lockUnlockedWallet(async () => unlocked);
    expect(unlocked.disconnect).toHaveBeenCalledTimes(1);
    const none = manager(null);
    await lockUnlockedWallet(async () => none);
    expect(none.disconnect).not.toHaveBeenCalled();
  });
});
