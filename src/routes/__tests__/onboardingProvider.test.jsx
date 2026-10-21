/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes } from 'react-router-dom';
const flags = { publicReadonly: false, fullStudio: true };
jest.unstable_mockModule('../../config/features', () => ({ default: flags, FEATURES: flags }));
jest.unstable_mockModule('../../services/apiClient/index.ts', () => ({ walletService: { getBalance: async () => ({ balance: '0' }) } }));
jest.unstable_mockModule('../../services/walletAuthService.ts', () => ({
  loginWalletWithSigner: async () => ({ token: 'synthetic-internal-login' }),
  loginWalletWithEd25519: async () => { throw new Error('Unexpected first-party login'); },
  clearWalletAuthSession: () => {},
}));
let useWallet;
jest.unstable_mockModule('../../pages/OnboardingPage', () => ({ default: () => <p>{useWallet().account || 'disconnected'}</p> }));
// Keep the route/provider code real; layout does not decide provider selection.
jest.unstable_mockModule('../../components/common/PageWrapper', () => ({ default: ({ children }) => children }));
({ useWallet } = await import('../../contexts/WalletContext.jsx'));
const { walletProviderManager } = await import('../../services/walletProviders/WalletProviderManager.js');
const { setActiveProvider, getActiveProvider } = await import('../../services/secureWalletStorage');
const { default: walletRoutes } = await import('../walletRoutes');
afterEach(async () => { cleanup(); await walletProviderManager.disconnect(); sessionStorage.clear(); localStorage.clear(); delete window.ethereum; });
it('internal onboarding preserves its retained generic browser provider', async () => {
  const address = `0x${'c'.repeat(40)}`;
  window.ethereum = { isMetaMask: true, request: jest.fn(async ({ method }) => method === 'eth_chainId' ? '0x309'
    : method === 'eth_getBalance' ? '0x0' : [address]), on: jest.fn(), removeListener: jest.fn() };
  setActiveProvider('metamask');
  render(<MemoryRouter initialEntries={['/onboarding']}><Routes>{walletRoutes()}</Routes></MemoryRouter>);
  expect(await screen.findByText(address)).toBeInTheDocument();
  expect(getActiveProvider()).toBe('metamask');
  expect(walletProviderManager.getActiveProvider().getType()).toBe('metamask');
});
