/**
 * @jest-environment jsdom
 */
// Owner decision 2026-11-09 (Phase 1): with VITE_ENABLE_PASSKEY_STATION_OWNER a passkey wallet saved in this
// browser can sign in and own the station. It is shown as connected but not earning yet, because the chain
// accepts passkey owners only once core4's passkey_station_owner is live.
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const OWNED = `0x${'ab'.repeat(20)}`;
const features = { publicReadonly: true, fullStudio: false, passkeyStationOwner: true };
let owned: string | null = null;
const navigateMock = jest.fn();
const loginWithEd25519 = jest.fn();
const loginWithPasskey = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const registerStation = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getStationRewardProgress = jest.fn();

await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: features, default: features }));
await jest.unstable_mockModule('../../hooks/useOwnedFirstPartyAddress', () => ({
  useOwnedFirstPartyAddress: () => owned,
}));
await jest.unstable_mockModule('react-router', () => ({ useNavigate: () => navigateMock }));
await jest.unstable_mockModule('@mui/material', () => {
  const pass = ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children);
  return {
    Box: pass, Stepper: pass, Step: pass, StepLabel: pass,
    Typography: ({ children }: { children?: React.ReactNode }) => React.createElement('span', null, children),
    CircularProgress: () => React.createElement('span', null, 'Loading'),
    Chip: ({ label }: { label?: React.ReactNode }) => React.createElement('span', null, label),
  };
});
await jest.unstable_mockModule('../../components/DesignSystem', () => ({
  WrfButton: ({ children, onClick, disabled }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean }) =>
    React.createElement('button', { onClick, disabled }, children),
  WrfCard: ({ children, headerTitle, onClick }: { children?: React.ReactNode; headerTitle?: string; onClick?: () => void }) =>
    React.createElement('div', { onClick }, headerTitle && React.createElement('strong', null, headerTitle), children),
  WrfInput: () => React.createElement('input'),
  WrfAlert: ({ children, title }: { children?: React.ReactNode; title?: string }) =>
    React.createElement('div', { role: 'alert' }, title && React.createElement('strong', null, title), children),
}));
await jest.unstable_mockModule('../../services/apiClient', () => ({
  FAUCET_DISCLAIMER: 'Experimental testnet only.',
  walletService: {},
  stationRegistrationService: {
    loginWithEd25519,
    loginWithPasskey,
    requestFaucetChallenge: jest.fn(),
    claimFaucet: jest.fn(),
    registerStation,
    getStationRewardProgress,
  },
}));

const { default: ConnectStationPage, ConfirmStep } = await import('../ConnectStationPage');
const { passkeyRecordAddress } = await import('../../services/walletCrypto/passkey');

const PASSKEY_KEY = 'wrfcoin.passkey.credential.v1';
const savePasskey = () => localStorage.setItem(PASSKEY_KEY, JSON.stringify({
  credentialId: '01'.repeat(16), publicKeyXY: '02'.repeat(64), rpId: 'wrfcoin.com',
}));
const PASSKEY_ADDRESS = passkeyRecordAddress({
  credentialId: new Uint8Array(16).fill(1), publicKeyXY: new Uint8Array(64).fill(2), rpId: 'wrfcoin.com',
}).toLowerCase();

const FORM = {
  name: 'Back yard', latitude: '10.0', longitude: '20.0', location: '', apiKey: 'k', appKey: 'a', hardware: '', mac: undefined,
};

describe('ConnectStationPage with a passkey owner (Phase 1)', () => {
  beforeEach(() => {
    owned = null;
    features.passkeyStationOwner = true;
    navigateMock.mockReset();
    loginWithEd25519.mockReset();
    loginWithPasskey.mockReset();
    registerStation.mockReset();
    getStationRewardProgress.mockReset();
    localStorage.clear();
  });
  afterEach(() => cleanup());

  it('passkey only: offers the passkey wallet (not the "12-word only" notice) and says it is not earning yet', () => {
    savePasskey();
    render(<ConnectStationPage />);
    expect(screen.getByText('Use your passkey wallet')).toBeInTheDocument();
    expect(screen.getByText(PASSKEY_ADDRESS)).toBeInTheDocument();
    expect(screen.getByText(/not earning yet/)).toBeInTheDocument();
    expect(screen.queryByText('Stations need a 12-word wallet')).toBeNull();
    expect(screen.queryByText('Set up or unlock your wallet first')).toBeNull();
  });

  it('signs in with one passkey prompt and goes straight to the station step (no 12-word faucet step)', async () => {
    savePasskey();
    loginWithPasskey.mockResolvedValue({ token: 'jwt', address: PASSKEY_ADDRESS, expiresIn: 900 });
    render(<ConnectStationPage />);
    fireEvent.click(screen.getByText('Use passkey wallet'));
    await waitFor(() => expect(loginWithPasskey).toHaveBeenCalledTimes(1));
    const [record] = loginWithPasskey.mock.calls[0] as [{ rpId: string }];
    expect(record.rpId).toBe('wrfcoin.com');
    expect(await screen.findByText('Your weather station')).toBeInTheDocument();
    expect(screen.queryByText('Fund your wallet (optional)')).toBeNull();
    expect(loginWithEd25519).not.toHaveBeenCalled();
  });

  it('a failed passkey sign-in stays on the wallet step with a plain error', async () => {
    savePasskey();
    loginWithPasskey.mockRejectedValue(new Error('NotAllowedError'));
    render(<ConnectStationPage />);
    fireEvent.click(screen.getByText('Use passkey wallet'));
    expect(await screen.findByText('Passkey sign-in did not finish. Please try again.')).toBeInTheDocument();
    expect(screen.getByText('Use your passkey wallet')).toBeInTheDocument();
  });

  it('signed in with a 12-word wallet too: both are offered, and the "passkey can\'t own" note is gone', () => {
    owned = OWNED;
    savePasskey();
    render(<ConnectStationPage />);
    expect(screen.getByText('Use your passkey wallet')).toBeInTheDocument();
    expect(screen.getByText('Use this wallet')).toBeInTheDocument();
    expect(screen.queryByText(/can't own a weather station yet/)).toBeNull();
  });

  it('signed in with a 12-word wallet too: the 12-word card comes first, is named, and says it earns', () => {
    owned = OWNED;
    savePasskey();
    const { container } = render(<ConnectStationPage />);
    const text = container.textContent ?? '';
    expect(screen.getByText('Use your 12-word wallet')).toBeInTheDocument();
    expect(screen.queryByText('Use your signed-in wallet')).toBeNull();
    expect(screen.getByText(/earns rewards once it is registered on chain/)).toBeInTheDocument();
    expect(text.indexOf(OWNED)).toBeGreaterThan(-1);
    expect(text.indexOf(OWNED)).toBeLessThan(text.indexOf('Use your passkey wallet'));
  });

  it('passkey and a LOCKED 12-word wallet saved: unlock-the-12-word card comes first, passkey after', () => {
    savePasskey();
    localStorage.setItem('wrfcoin_wallet_vault_v1', JSON.stringify({
      v: 1, scheme: 'ed25519-slip10-master-v1', address: `0x${'cd'.repeat(20)}`,
      kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600_000, salt: 'AA==' },
      cipher: { name: 'AES-GCM', iv: 'AA==' }, ct: 'AA==',
    }));
    const { container } = render(<ConnectStationPage />);
    const text = container.textContent ?? '';
    expect(text.indexOf('Unlock your 12-word wallet')).toBeGreaterThan(-1);
    expect(text.indexOf('Unlock your 12-word wallet')).toBeLessThan(text.indexOf('Use your passkey wallet'));
  });

  it('passkey only: the passkey card is the only wallet offered (no 12-word card, no earning line)', () => {
    savePasskey();
    render(<ConnectStationPage />);
    expect(screen.getByText('Use your passkey wallet')).toBeInTheDocument();
    expect(screen.queryByText('Use your 12-word wallet')).toBeNull();
    expect(screen.queryByText(/earns rewards once it is registered on chain/)).toBeNull();
  });

  it('flag off: the passkey wallet is not offered and the old notice stays', () => {
    features.passkeyStationOwner = false;
    savePasskey();
    render(<ConnectStationPage />);
    expect(screen.queryByText('Use your passkey wallet')).toBeNull();
    expect(screen.getByText('Stations need a 12-word wallet')).toBeInTheDocument();
  });

  it('confirm and success screens mark a passkey owner as not earning yet, with no reward progress panel', async () => {
    registerStation.mockResolvedValue({ stationId: 'stn_1' });
    render(<ConfirmStep address={PASSKEY_ADDRESS} form={FORM} ownerKind="passkey" />);
    expect(screen.getByText(`${PASSKEY_ADDRESS} (passkey wallet)`)).toBeInTheDocument();
    expect(screen.getByText('Not earning yet')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Register Station'));
    expect(await screen.findByText('Station registered')).toBeInTheDocument();
    expect(screen.getByText('Not earning yet')).toBeInTheDocument();
    expect(getStationRewardProgress).not.toHaveBeenCalled();
  });
});
