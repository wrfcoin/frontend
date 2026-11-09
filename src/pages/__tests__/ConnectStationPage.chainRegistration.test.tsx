/**
 * @jest-environment jsdom
 */
// A station connected on the website is collected right away but earns only once it is registered on
// chain, which is done in batches after the owner's wallet has signed for it. The page says which of the
// three it is: one step left (sign), connected and waiting, or earning. "Earning" comes only from the
// backend's reading of the chain. Made-up ids and addresses.
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const OWNER = `0x${'ab'.repeat(20)}`;
const STATION = 'pws-0123456789abcdef';
const PROOF = { owner_pubkey: 'cd'.repeat(32), owner_signature: 'ef'.repeat(64) };
const features = { publicReadonly: true, fullStudio: false, passkeyStationOwner: false };
let vaultAddress: string | null = null;
const registerStation = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getStationRewardProgress = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const submitStationOwnershipProof = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const withOwnerKey = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const signStationOwnership = jest.fn<(...args: unknown[]) => unknown>();

await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: features, default: features }));
await jest.unstable_mockModule('../../config/network', () => ({ WRFCOIN_CHAIN_ID: '888' }));
await jest.unstable_mockModule('../../hooks/useOwnedFirstPartyAddress', () => ({ useOwnedFirstPartyAddress: () => null }));
await jest.unstable_mockModule('react-router', () => ({ useNavigate: () => jest.fn() }));
await jest.unstable_mockModule('../../services/walletVault', () => ({
  readVault: () => (vaultAddress ? { address: vaultAddress } : null),
}));
await jest.unstable_mockModule('../../services/walletCrypto/deviceSession', () => ({ withOwnerKey }));
await jest.unstable_mockModule('../../services/walletCrypto/stationOwnership', () => ({ signStationOwnership }));
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

const { ConfirmStep, StationRewardProgressPanel, newNeutralStationId } = await import('../ConnectStationPage');

const progress = (chainRegistration?: unknown) => ({
  schemaVersion: 1, stationId: STATION, ownerAddress: OWNER, state: 'AWAITING_OBSERVATION',
  asOf: '2026-11-09T00:00:00.000Z', evidenceFresh: true, registration: { state: 'REGISTERED', registeredAt: null },
  chain: null, observation: null, contribution: null, reward: null, diagnostic: null,
  ...(chainRegistration === undefined ? {} : { chainRegistration }),
});
const reg = (state: string) => ({ state, stationId: STATION });
const FORM = {
  name: 'Back yard', latitude: '10.0', longitude: '20.0', location: '', apiKey: 'k', appKey: 'a', hardware: '', mac: undefined,
};

describe('station page: on-chain registration status', () => {
  beforeEach(() => {
    vaultAddress = null;
    for (const mock of [registerStation, getStationRewardProgress, submitStationOwnershipProof, withOwnerKey, signStationOwnership]) mock.mockReset();
  });
  afterEach(() => cleanup());

  it('waiting: says connected, not earning yet, done in batches, nothing to do; no reward claim is shown', async () => {
    getStationRewardProgress.mockResolvedValue(progress(reg('waiting')));
    render(<StationRewardProgressPanel stationId={STATION} />);
    const notice = await screen.findByTestId('station-chain-waiting');
    expect(notice).toHaveTextContent('Connected. Waiting for on-chain registration');
    expect(notice).toHaveTextContent(/isn.t earning yet/);
    expect(notice).toHaveTextContent('in batches');
    expect(notice).toHaveTextContent(/You don.t need to do anything/);
    expect(screen.queryByText('Awaiting first observation')).toBeNull();
    expect(screen.queryByTestId('station-chain-earning')).toBeNull();
    expect(submitStationOwnershipProof).not.toHaveBeenCalled();
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
      expect(screen.queryByTestId('station-chain-waiting')).toBeNull();
      expect(screen.queryByTestId('station-chain-earning')).toBeNull();
      expect(screen.queryByTestId('station-chain-needs-signature')).toBeNull();
      cleanup();
    }
  });

  it('a brand-new wallet: its signature made in advance is handed in once, and the page moves to waiting', async () => {
    getStationRewardProgress
      .mockResolvedValueOnce(progress(reg('needs_owner_signature')))
      .mockResolvedValue(progress(reg('waiting')));
    submitStationOwnershipProof.mockResolvedValue(reg('waiting'));
    render(<StationRewardProgressPanel stationId={STATION} presigned={{ stationId: STATION, proof: PROOF }} />);
    await waitFor(() => expect(submitStationOwnershipProof).toHaveBeenCalledTimes(1));
    expect(submitStationOwnershipProof).toHaveBeenCalledWith(STATION, PROOF);
    expect(await screen.findByTestId('station-chain-waiting')).toBeInTheDocument();
    expect(submitStationOwnershipProof).toHaveBeenCalledTimes(1);
    expect(withOwnerKey).not.toHaveBeenCalled();
  });

  it('a signature made for another station id is never sent', async () => {
    getStationRewardProgress.mockResolvedValue(progress(reg('needs_owner_signature')));
    render(<StationRewardProgressPanel stationId={STATION} presigned={{ stationId: 'pws-ffffffffffffffff', proof: PROOF }} />);
    expect(await screen.findByTestId('station-chain-needs-signature')).toBeInTheDocument();
    expect(submitStationOwnershipProof).not.toHaveBeenCalled();
    expect(screen.getByTestId('station-chain-no-wallet-here')).toBeInTheDocument();
  });

  it('a wallet saved in this browser: asks for the password, signs for this station only, then waiting', async () => {
    vaultAddress = OWNER;
    getStationRewardProgress
      .mockResolvedValueOnce(progress(reg('needs_owner_signature')))
      .mockResolvedValue(progress(reg('waiting')));
    const account = { address: OWNER };
    withOwnerKey.mockImplementation(async (_owner, _password, run) => (run as (a: unknown) => unknown)(account));
    signStationOwnership.mockReturnValue(PROOF);
    submitStationOwnershipProof.mockResolvedValue(reg('waiting'));
    render(<StationRewardProgressPanel stationId={STATION} />);
    const notice = await screen.findByTestId('station-chain-needs-signature');
    expect(notice).toHaveTextContent('One step left before this station can earn');
    expect(notice).toHaveTextContent('moves no coins');
    const button = screen.getByText('Sign for my station');
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByText('Sign for my station'));
    await waitFor(() => expect(submitStationOwnershipProof).toHaveBeenCalledWith(STATION, PROOF));
    expect(withOwnerKey.mock.calls[0][0]).toBe(OWNER);
    expect(signStationOwnership).toHaveBeenCalledWith(account, STATION, { chainId: '888', networkId: 'testnet' });
    expect(await screen.findByTestId('station-chain-waiting')).toBeInTheDocument();
  });

  it('a wrong password signs and sends nothing', async () => {
    vaultAddress = OWNER;
    getStationRewardProgress.mockResolvedValue(progress(reg('needs_owner_signature')));
    withOwnerKey.mockRejectedValue(new Error('unlock failed'));
    render(<StationRewardProgressPanel stationId={STATION} />);
    await screen.findByTestId('station-chain-needs-signature');
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByText('Sign for my station'));
    expect(await screen.findByText('That password did not unlock your 12-word wallet. Nothing was signed.')).toBeInTheDocument();
    expect(submitStationOwnershipProof).not.toHaveBeenCalled();
  });

  it('no wallet for this owner in this browser: says where to sign, offers no button', async () => {
    getStationRewardProgress.mockResolvedValue(progress(reg('needs_owner_signature')));
    render(<StationRewardProgressPanel stationId={STATION} />);
    expect(await screen.findByTestId('station-chain-no-wallet-here')).toHaveTextContent('12-word wallet');
    expect(screen.queryByText('Sign for my station')).toBeNull();
  });

  it('a failed hand-in says so and can be tried again', async () => {
    getStationRewardProgress.mockResolvedValue(progress(reg('needs_owner_signature')));
    submitStationOwnershipProof.mockRejectedValueOnce(new Error('503')).mockResolvedValue(reg('waiting'));
    render(<StationRewardProgressPanel stationId={STATION} presigned={{ stationId: STATION, proof: PROOF }} />);
    expect(await screen.findByText('Your signature could not be saved. Please try again.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Try again'));
    await waitFor(() => expect(submitStationOwnershipProof).toHaveBeenCalledTimes(2));
  });

  it('registering with a brand-new wallet uses the station id that wallet signed for', async () => {
    registerStation.mockResolvedValue({ stationId: STATION });
    getStationRewardProgress.mockResolvedValue(progress(reg('waiting')));
    render(<ConfirmStep address={OWNER} form={FORM} presigned={{ stationId: STATION, proof: PROOF }} />);
    fireEvent.click(screen.getByText('Register Station'));
    expect(await screen.findByText('Station registered')).toBeInTheDocument();
    expect((registerStation.mock.calls[0][0] as { stationId?: string }).stationId).toBe(STATION);
  });

  it('registering with a signed-in wallet sends no station id (the backend picks it)', async () => {
    registerStation.mockResolvedValue({ stationId: 'pws-back-yard-a1b2c3' });
    getStationRewardProgress.mockResolvedValue({ ...progress(), stationId: 'pws-back-yard-a1b2c3' });
    render(<ConfirmStep address={OWNER} form={FORM} />);
    fireEvent.click(screen.getByText('Register Station'));
    expect(await screen.findByText('Station registered')).toBeInTheDocument();
    expect('stationId' in (registerStation.mock.calls[0][0] as object)).toBe(false);
  });

  it('a made-up station id has nothing personal in it', () => {
    const a = newNeutralStationId();
    expect(a).toMatch(/^pws-[0-9a-f]{16}$/);
    expect(newNeutralStationId()).not.toBe(a);
  });
});
