/**
 * @jest-environment jsdom
 */
// The connect wizard's last step: the on-chain registration notice sits above the reward progress, a
// brand-new wallet signs for its station once the server has issued the station id, and the station id is
// always the server's. The notice's own states are covered in
// components/Weather/__tests__/StationChainRegistration.test.tsx. Made-up ids and addresses.
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';

const OWNER = `0x${'ab'.repeat(20)}`;
const STATION = 'pws-0123456789abcdef';
const PROOF = { owner_pubkey: 'cd'.repeat(32), owner_signature: 'ef'.repeat(64) };
const features = { publicReadonly: true, fullStudio: false, passkeyStationOwner: false };
const registerStation = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getStationRewardProgress = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const submitStationOwnershipProof = jest.fn<(...args: unknown[]) => Promise<unknown>>();

await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: features, default: features }));
await jest.unstable_mockModule('../../config/network', () => ({ WRFCOIN_CHAIN_ID: '888' }));
await jest.unstable_mockModule('../../hooks/useOwnedFirstPartyAddress', () => ({ useOwnedFirstPartyAddress: () => null }));
await jest.unstable_mockModule('react-router', () => ({ useNavigate: () => jest.fn() }));
await jest.unstable_mockModule('../../services/walletVault', () => ({ readVault: () => null }));
await jest.unstable_mockModule('../../services/walletCrypto/deviceSession', () => ({ withOwnerKey: jest.fn() }));
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
  WrfCard: ({ children, headerTitle }: { children?: React.ReactNode; headerTitle?: string }) =>
    React.createElement('div', null, headerTitle && React.createElement('strong', null, headerTitle), children),
  WrfInput: ({ label, value, onChange, type }: { label?: string; value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; type?: string }) =>
    React.createElement('input', { 'aria-label': label, value, onChange, type }),
  WrfAlert: ({ children, title, ...rest }: { children?: React.ReactNode; title?: string; 'data-testid'?: string }) =>
    React.createElement('div', { role: 'alert', 'data-testid': rest['data-testid'] }, title && React.createElement('strong', null, title), children),
}));
await jest.unstable_mockModule('../../services/apiClient', () => ({
  FAUCET_DISCLAIMER: 'Experimental testnet only.',
  walletService: {},
  stationRegistrationService: {
    registerStation, getStationRewardProgress, submitStationOwnershipProof,
    loginWithEd25519: jest.fn(), loginWithPasskey: jest.fn(), requestFaucetChallenge: jest.fn(), claimFaucet: jest.fn(),
  },
}));

const { ConfirmStep, StationRewardProgressPanel, useHeldOwnershipSigner, OWNERSHIP_SIGNER_MAX_MS } = await import('../ConnectStationPage');

const progress = (chainRegistration?: unknown) => ({
  schemaVersion: 1, stationId: STATION, ownerAddress: OWNER, state: 'AWAITING_OBSERVATION',
  asOf: '2026-11-09T00:00:00.000Z', evidenceFresh: true, registration: { state: 'REGISTERED', registeredAt: null },
  chain: null, observation: null, contribution: null, reward: null, diagnostic: null,
  ...(chainRegistration === undefined ? {} : { chainRegistration }),
});
const reg = (state: string, extra: Record<string, unknown> = {}) =>
  ({ state, stationId: STATION, chainId: '888', networkId: 'testnet', ...extra });
const FORM = {
  name: 'Back yard', latitude: '10.0', longitude: '20.0', location: '', apiKey: 'k', appKey: 'a', hardware: '', mac: undefined,
};

describe('connect wizard: on-chain registration status', () => {
  beforeEach(() => {
    for (const mock of [registerStation, getStationRewardProgress, submitStationOwnershipProof]) mock.mockReset();
  });
  afterEach(() => cleanup());

  it('until the station is registered on chain, the registration notice stands alone: no reward claim under it', async () => {
    for (const [r, testid] of [
      [reg('waiting', { waitingFor: 'batch' }), 'station-chain-waiting'],
      [reg('waiting', { waitingFor: 'station_report' }), 'station-chain-waiting-report'],
      [reg('blocked', { blockedReason: 'station_id_taken_on_chain' }), 'station-chain-blocked'],
      [reg('needs_owner_signature'), 'station-chain-needs-signature'],
    ] as Array<[unknown, string]>) {
      getStationRewardProgress.mockResolvedValue(progress(r));
      render(<StationRewardProgressPanel stationId={STATION} />);
      expect(await screen.findByTestId(testid)).toBeInTheDocument();
      expect(screen.queryByText('Awaiting first observation')).toBeNull();
      expect(screen.queryByTestId('station-chain-earning')).toBeNull();
      cleanup();
    }
  });

  it('earning: says so, and the reward progress is shown under it', async () => {
    getStationRewardProgress.mockResolvedValue(progress(reg('earning')));
    render(<StationRewardProgressPanel stationId={STATION} />);
    expect(await screen.findByTestId('station-chain-earning')).toHaveTextContent('Earning');
    expect(screen.getByText('Awaiting first observation')).toBeInTheDocument();
  });

  it('a backend that reports nothing (switch off): the page is what it was before', async () => {
    for (const shown of [progress(), progress(null)]) {
      getStationRewardProgress.mockResolvedValue(shown);
      render(<StationRewardProgressPanel stationId={STATION} />);
      expect(await screen.findByText('Awaiting first observation')).toBeInTheDocument();
      for (const id of ['station-chain-waiting', 'station-chain-earning', 'station-chain-needs-signature', 'station-chain-blocked']) {
        expect(screen.queryByTestId(id)).toBeNull();
      }
      cleanup();
    }
  });

  it('a brand-new wallet: registers, then signs for the id the server issued, hands it in, and only then is released', async () => {
    registerStation.mockResolvedValue({ stationId: STATION });
    getStationRewardProgress
      .mockResolvedValueOnce(progress(reg('needs_owner_signature')))
      .mockResolvedValue(progress(reg('waiting', { waitingFor: 'batch' })));
    submitStationOwnershipProof.mockResolvedValue(reg('waiting'));
    const signer = { sign: jest.fn(() => PROOF), release: jest.fn() };
    render(<ConfirmStep address={OWNER} form={FORM} ownershipSigner={signer as never} />);
    // Nothing is signed before the station exists.
    expect(signer.sign).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Register Station'));
    expect(await screen.findByText('Station registered')).toBeInTheDocument();
    await waitFor(() => expect(submitStationOwnershipProof).toHaveBeenCalledWith(STATION, PROOF));
    expect(signer.sign).toHaveBeenCalledWith(STATION, { chainId: '888', networkId: 'testnet' });
    expect(await screen.findByTestId('station-chain-waiting')).toBeInTheDocument();
    expect(signer.release).toHaveBeenCalled();
    expect(submitStationOwnershipProof).toHaveBeenCalledTimes(1);
  });

  it('the key is dropped as soon as the server shows it is not needed: no registration state, or any state but the signature step', async () => {
    for (const shown of [
      progress(), progress(null), progress(reg('waiting', { waitingFor: 'batch' })), progress(reg('earning')),
      progress(reg('blocked', { blockedReason: 'station_id_taken_on_chain' })),
    ]) {
      getStationRewardProgress.mockResolvedValue(shown);
      const signer = { sign: jest.fn(() => PROOF), release: jest.fn() };
      render(<StationRewardProgressPanel stationId={STATION} ownershipSigner={signer as never} />);
      await waitFor(() => expect(signer.release).toHaveBeenCalled());
      expect(signer.sign).not.toHaveBeenCalled();
      expect(submitStationOwnershipProof).not.toHaveBeenCalled();
      cleanup();
    }
  });

  it('while the read has not answered, or failed, the key is kept (the timer and leaving the page bound it)', async () => {
    getStationRewardProgress.mockRejectedValue(new Error('down'));
    const signer = { sign: jest.fn(() => PROOF), release: jest.fn() };
    render(<StationRewardProgressPanel stationId={STATION} ownershipSigner={signer as never} />);
    expect(await screen.findByText('Reward progress unavailable')).toBeInTheDocument();
    expect(signer.release).not.toHaveBeenCalled();
  });
});

describe('useHeldOwnershipSigner: how long a brand-new wallet\'s key is held', () => {
  const raw = () => ({ sign: jest.fn(() => PROOF), release: jest.fn() });
  afterEach(() => { jest.useRealTimers(); cleanup(); });

  it('release drops the key once, takes the signer out of page state, and the old handle can no longer sign', () => {
    const signer = raw();
    const { result } = renderHook(() => useHeldOwnershipSigner());
    act(() => result.current[1](signer as never));
    const held = result.current[0]!;
    expect(held.sign(STATION, { chainId: '888', networkId: 'testnet' })).toBe(PROOF);
    act(() => { held.release(); held.release(); });
    expect(signer.release).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBeUndefined();
    expect(() => held.sign(STATION, { chainId: '888', networkId: 'testnet' })).toThrow('no longer held');
    expect(signer.sign).toHaveBeenCalledTimes(1);
  });

  it('after ten minutes the key is dropped, and not a moment before', () => {
    jest.useFakeTimers();
    expect(OWNERSHIP_SIGNER_MAX_MS).toBe(600_000);
    const signer = raw();
    const { result } = renderHook(() => useHeldOwnershipSigner());
    act(() => result.current[1](signer as never));
    act(() => { jest.advanceTimersByTime(OWNERSHIP_SIGNER_MAX_MS - 1); });
    expect(signer.release).not.toHaveBeenCalled();
    expect(result.current[0]).toBeDefined();
    act(() => { jest.advanceTimersByTime(1); });
    expect(signer.release).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBeUndefined();
  });

  it('leaving the page drops the key; a second wallet replaces and releases the first', () => {
    const first = raw();
    const second = raw();
    const { result, unmount } = renderHook(() => useHeldOwnershipSigner());
    act(() => result.current[1](first as never));
    act(() => result.current[1](second as never));
    expect(first.release).toHaveBeenCalledTimes(1);
    expect(second.release).not.toHaveBeenCalled();
    unmount();
    expect(second.release).toHaveBeenCalledTimes(1);
  });

  it('registration never sends a station id: the server issues it', async () => {
    registerStation.mockResolvedValue({ stationId: STATION });
    getStationRewardProgress.mockResolvedValue(progress(reg('waiting', { waitingFor: 'batch' })));
    render(<ConfirmStep address={OWNER} form={FORM} ownershipSigner={{ sign: jest.fn(), release: jest.fn() } as never} />);
    fireEvent.click(screen.getByText('Register Station'));
    expect(await screen.findByText('Station registered')).toBeInTheDocument();
    expect('stationId' in (registerStation.mock.calls[0][0] as object)).toBe(false);
  });
});
