// One session, one wallet: the hook a login calls before another wallet's session can exist.
import { jest } from '@jest/globals';
import { beforeWalletLogin, onBeforeWalletLogin } from '../walletSessionSwitch';

describe('walletSessionSwitch', () => {
  it('does nothing without a handler', async () => {
    await expect(beforeWalletLogin('0xAB')).resolves.toBeUndefined();
  });

  it('calls the registered handler with the lower-cased address, and stops after it is removed', async () => {
    const handler = jest.fn<(address: string) => void>();
    const remove = onBeforeWalletLogin(handler);
    await beforeWalletLogin('0xABCD');
    expect(handler).toHaveBeenCalledWith('0xabcd');
    remove();
    await beforeWalletLogin('0xABCD');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('removing an older handler does not remove the current one', async () => {
    const first = jest.fn<(address: string) => void>();
    const second = jest.fn<(address: string) => void>();
    const removeFirst = onBeforeWalletLogin(first);
    const removeSecond = onBeforeWalletLogin(second);
    removeFirst();
    await beforeWalletLogin('0x01');
    expect(second).toHaveBeenCalledTimes(1);
    removeSecond();
  });

  it('a handler that fails stops the login', async () => {
    const remove = onBeforeWalletLogin(() => { throw new Error('could not lock'); });
    await expect(beforeWalletLogin('0x01')).rejects.toThrow('could not lock');
    remove();
  });
});
