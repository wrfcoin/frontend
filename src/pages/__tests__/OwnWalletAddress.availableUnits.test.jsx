/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// The wallet page hands the balance the earnings panel read (exact base units, or null while unknown)
// to the Send form, which refuses a transfer the balance cannot cover before any preview or signing.
const address = '0x' + '1'.repeat(40);
let panelBalance = '0';
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({ useWallet: () => ({ account: address, activeProvider: 'custom', isConnected: true, receiveOnly: false }) }));
await jest.unstable_mockModule('../../services/walletProviders/WalletProviderManager.js', () => ({ walletProviderManager: { getLoginIdentity: () => ({ scheme: 'ed25519', address }) } }));
await jest.unstable_mockModule('../../services/walletVault', () => ({ readVault: () => ({ address }) }));
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: { walletSend: true } }));
await jest.unstable_mockModule('../../components/wallet/PhoneStationStatusCard', () => ({ default: () => null }));
await jest.unstable_mockModule('../../components/wallet/VaultSend', () => ({ default: ({ availableUnits }) => <button data-available={availableUnits ?? 'unknown'}>Send</button> }));
await jest.unstable_mockModule('../../components/wallet/WalletEarningsPanel', () => ({ default: ({ onAvailableUnits }) => { React.useEffect(() => { onAvailableUnits?.(panelBalance); }, [onAvailableUnits]); return null; } }));
const { default: OwnWalletAddress } = await import('../OwnWalletAddress');
afterEach(cleanup);
const mount = () => render(<MemoryRouter><OwnWalletAddress /></MemoryRouter>);
it('hands a zero balance to Send as the exact base-units string', async () => {
  panelBalance = '0';
  mount();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Send' }).getAttribute('data-available')).toBe('0'));
});
it('hands an unknown balance to Send as null, so nothing is gated', async () => {
  panelBalance = null;
  mount();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Send' }).getAttribute('data-available')).toBe('unknown'));
});
