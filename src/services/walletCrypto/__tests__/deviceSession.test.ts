/** @jest-environment node */
/**
 * The device-signed send refuses, before loading the key or signing anything,
 * any recipient the app-level address-book allowlist (frontend#42) refuses.
 */
import { describe, expect, it, jest } from '@jest/globals';
import { DeviceSendRefusedError, submitDeviceTransfer } from '../deviceSession';
import { memoryDeviceKeyStorage, setDeviceKeyStorage } from '../deviceKeyStore';

const preview = {
  from: `0x${'1'.repeat(40)}`, to: `0x${'3'.repeat(40)}`, amountBaseUnits: '100000000', nonce: '1', chainId: '888', networkId: 'testnet' as const,
};

describe('submitDeviceTransfer and the allowlist', () => {
  it('a refused recipient throws DeviceSendRefusedError; no key is read, nothing is signed or sent', async () => {
    const storage = memoryDeviceKeyStorage();
    const get = jest.spyOn(storage, 'get');
    setDeviceKeyStorage(storage);
    const fetchSpy = jest.fn<typeof fetch>();
    global.fetch = fetchSpy;
    const refusal = jest.fn((to: string) => `Send refused: ${to} is not in your address book.`);
    await expect(submitDeviceTransfer(preview, refusal)).rejects.toBeInstanceOf(DeviceSendRefusedError);
    expect(refusal).toHaveBeenCalledWith(preview.to);
    expect(get).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
