/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const { default: SecureMessaging } = await import('../SecureMessaging');
const originalFetch = global.fetch;
afterEach(() => { cleanup(); global.fetch = originalFetch; delete window.ethereum; });
it('unsupported messaging exposes no invented encryption, contacts, delivery or wallet prompts', () => {
  window.ethereum = { request: jest.fn(async () => [`0x${'a'.repeat(40)}`]) };
  global.fetch = jest.fn(async () => ({ ok: false, status: 404 }));
  render(<SecureMessaging />);
  expect(screen.getByText('Secure messaging is unavailable')).toBeInTheDocument();
  expect(screen.queryByText(/End-to-End Encryption Active|Tony Stark|Blockchain Messaging Ready/)).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(window.ethereum.request).not.toHaveBeenCalled();
});
