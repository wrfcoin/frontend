import { jest } from '@jest/globals';
import BlockchainMessagingService from '../blockchainMessaging';
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; delete window.ethereum; });
it.each(['connectWallet', 'initializeXMTPClient', 'initializePushProtocol', 'sendMessage', 'canReceiveMessages', 'sendXMTPMessage', 'sendPushNotification', 'getMessageHistory', 'setupMessageListener'])('%s refuses unsupported messaging without success, receipts or I/O', async method => {
  const service = new BlockchainMessagingService();
  service.isConnected = true; // A caller cannot bypass refusal by setting a local readiness flag.
  window.ethereum = { request: jest.fn(async () => [`0x${'a'.repeat(40)}`]) };
  global.fetch = jest.fn(async () => ({ ok: false, status: 404 }));
  await expect(service[method](`0x${'b'.repeat(40)}`, 'synthetic message')).rejects.toThrow(/unavailable/);
  expect(global.fetch).not.toHaveBeenCalled();
  expect(window.ethereum.request).not.toHaveBeenCalled();
});
