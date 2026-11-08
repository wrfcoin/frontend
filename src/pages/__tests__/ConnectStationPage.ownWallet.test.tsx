/**
 * @jest-environment jsdom
 */
// W28 (owner ruling 2026-10-02 #14): a station joins with the visitor's ONE wallet. With a signed-in first-party
// wallet the page offers it and skips any second login; the public build never creates another wallet and
// sends a visitor without one to wallet setup. Internal builds keep the in-page create flow.
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const OWNED = `0x${'ab'.repeat(20)}`;
const features = { publicReadonly: true, fullStudio: false };
let owned: string | null = null;
const navigateMock = jest.fn();
const loginWithEd25519 = jest.fn();

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
    requestFaucetChallenge: jest.fn(),
    claimFaucet: jest.fn(),
    registerStation: jest.fn(),
    getStationRewardProgress: jest.fn(),
  },
}));

const { default: ConnectStationPage } = await import('../ConnectStationPage');

// A passkey wallet saved in this browser, in the format saveStoredPasskey writes.
const PASSKEY_KEY = 'wrfcoin.passkey.credential.v1';
const savePasskey = () => localStorage.setItem(PASSKEY_KEY, JSON.stringify({
  credentialId: '01'.repeat(16), publicKeyXY: '02'.repeat(64), rpId: 'wrfcoin.com',
}));

describe('ConnectStationPage joins with the visitor\'s one wallet (W28)', () => {
  beforeEach(() => {
    owned = null;
    features.publicReadonly = true;
    features.fullStudio = false;
    navigateMock.mockReset();
    loginWithEd25519.mockReset();
    localStorage.clear();
  });
  afterEach(() => cleanup());

  it('signed in: offers that wallet, uses it with no second login, and moves on to Fund', () => {
    owned = OWNED;
    render(<ConnectStationPage />);
    expect(screen.getByText('Use your signed-in wallet')).toBeInTheDocument();
    expect(screen.getByText(OWNED)).toBeInTheDocument();
    expect(screen.queryByText('Create a new wallet')).toBeNull();
    fireEvent.click(screen.getByText('Use this wallet'));
    expect(screen.getByText('Fund your wallet (optional)')).toBeInTheDocument();
    expect(screen.getAllByText(OWNED).length).toBeGreaterThan(0);
    expect(loginWithEd25519).not.toHaveBeenCalled();
  });

  it('signed in on an internal build: the same wallet is offered first, not a new one', () => {
    owned = OWNED;
    features.publicReadonly = false;
    features.fullStudio = true;
    render(<ConnectStationPage />);
    expect(screen.getByText('Use your signed-in wallet')).toBeInTheDocument();
    expect(screen.queryByText('Create a new wallet')).toBeNull();
  });

  it('public build, not signed in: sends the visitor to wallet setup; never creates a wallet here', () => {
    render(<ConnectStationPage />);
    expect(screen.getByText('Set up or unlock your wallet first')).toBeInTheDocument();
    expect(screen.queryByText('Stations need a 12-word wallet')).toBeNull();
    expect(screen.queryByText('Create a new wallet')).toBeNull();
    expect(screen.queryByText(/recovery phrase/)).toBeNull();
    fireEvent.click(screen.getByText('Open wallet setup'));
    expect(navigateMock).toHaveBeenCalledWith('/onboarding');
  });

  it('signed in with a passkey wallet saved too: the signed-in 12-word wallet is still offered', () => {
    owned = OWNED;
    savePasskey();
    render(<ConnectStationPage />);
    expect(screen.getByText('Use this wallet')).toBeInTheDocument();
    expect(screen.queryByText('Stations need a 12-word wallet')).toBeNull();
  });

  it('public build, passkey wallet only: says stations need a 12-word wallet and links to wallet setup', () => {
    savePasskey();
    render(<ConnectStationPage />);
    expect(screen.getByText('Stations need a 12-word wallet')).toBeInTheDocument();
    expect(screen.getByText(/Your passkey wallet can't own a weather station yet/)).toBeInTheDocument();
    expect(screen.queryByText('Set up or unlock your wallet first')).toBeNull();
    expect(screen.queryByText('Use this wallet')).toBeNull();
    fireEvent.click(screen.getByText('Open wallet setup'));
    expect(navigateMock).toHaveBeenCalledWith('/onboarding');
  });

  it('public build, a malformed saved passkey record counts as no wallet', () => {
    localStorage.setItem(PASSKEY_KEY, '{"publicKeyXY":"zz"}');
    render(<ConnectStationPage />);
    expect(screen.getByText('Set up or unlock your wallet first')).toBeInTheDocument();
    expect(screen.queryByText('Stations need a 12-word wallet')).toBeNull();
  });

  it('internal build, not signed in: keeps the in-page create flow', () => {
    features.publicReadonly = false;
    features.fullStudio = true;
    render(<ConnectStationPage />);
    expect(screen.getByText('Create a new wallet')).toBeInTheDocument();
    expect(screen.queryByText('Set up or unlock your wallet first')).toBeNull();
  });
});
