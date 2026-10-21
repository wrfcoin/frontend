/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect, jest, test } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const featuresMock = { walletSend: false };
let postCount = 0;
const server = setupServer(
  http.post('*/wallet/send', () => {
    postCount += 1;
    return HttpResponse.json({ txHash: 'forbidden' });
  }),
);

await jest.unstable_mockModule('../../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));
await jest.unstable_mockModule('../../../DesignSystem', () => ({
  WrfButton: ({ children }) => <button type="button">{children}</button>,
}));
await jest.unstable_mockModule('../SendModal.css', () => ({}));
await jest.unstable_mockModule('../ComingSoonPanel.css', () => ({}));

const { default: SendModal } = await import('../SendModal.jsx');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  postCount = 0;
  featuresMock.walletSend = false;
});
afterAll(() => server.close());

test('renders only the honest unavailable state and sends no request', () => {
  render(<SendModal onClose={jest.fn()} />);

  expect(screen.getByTestId('send-unavailable')).toBeInTheDocument();
  expect(screen.getByText('Sending is not available yet')).toBeInTheDocument();
  expect(screen.getByText(/must be signed by your key/i)).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('0.00')).not.toBeInTheDocument();
  expect(screen.queryByText(/success|submitted|transaction hash/i)).not.toBeInTheDocument();
  expect(postCount).toBe(0);
});

test('keeps a MetaMask-connected wallet unavailable when send is enabled', () => {
  featuresMock.walletSend = true;
  const sendTransaction = jest.fn();

  render(
    <SendModal
      onClose={jest.fn()}
      activeProvider="metamask"
      receiveOnly={false}
      sendWalletTransaction={sendTransaction}
    />,
  );

  expect(screen.getByTestId('send-unavailable')).toBeInTheDocument();
  expect(sendTransaction).not.toHaveBeenCalled();
  expect(postCount).toBe(0);
});

test('keeps a receive-only custom wallet unavailable when send is enabled', () => {
  featuresMock.walletSend = true;
  const sendTransaction = jest.fn();

  render(
    <SendModal
      onClose={jest.fn()}
      activeProvider="custom"
      receiveOnly={true}
      sendWalletTransaction={sendTransaction}
    />,
  );

  expect(screen.getByTestId('send-unavailable')).toBeInTheDocument();
  expect(sendTransaction).not.toHaveBeenCalled();
  expect(postCount).toBe(0);
});
