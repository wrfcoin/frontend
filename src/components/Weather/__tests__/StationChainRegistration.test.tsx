/**
 * @jest-environment jsdom
 */
// The owner's view of a website station's on-chain registration: one step left (sign), waiting (and for
// what), earning, or blocked (and why). Earning and blocked come only from the backend's reading of the
// chain. Made-up ids and addresses.
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const OWNER = `0x${'ab'.repeat(20)}`;
const STATION = 'pws-0123456789abcdef';
const PROOF = { owner_pubkey: 'cd'.repeat(32), owner_signature: 'ef'.repeat(64) };
let vaultAddress: string | null = null;
let storedPasskey: unknown = null;
let passkeyAddress = `0x${'12'.repeat(20)}`;
let token: string | null = null;
let subject: string | null = null;
const submitStationOwnershipProof = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getStationChainRegistration = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const withOwnerKey = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const signStationOwnership = jest.fn<(...args: unknown[]) => unknown>();

class MockApiError extends Error {
  status: number;
  details?: Record<string, unknown>;
  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

await jest.unstable_mockModule('../../../config/network', () => ({ WRFCOIN_CHAIN_ID: '888' }));
await jest.unstable_mockModule('../../../utils/apiError', () => ({ default: MockApiError }));
await jest.unstable_mockModule('../../../services/walletVault', () => ({
  readVault: () => (vaultAddress ? { address: vaultAddress } : null),
}));
await jest.unstable_mockModule('../../../services/walletCrypto/deviceSession', () => ({ withOwnerKey }));
await jest.unstable_mockModule('../../../services/walletCrypto/stationOwnership', () => ({ signStationOwnership }));
await jest.unstable_mockModule('../../../services/walletCrypto/passkeySend', () => ({ loadStoredPasskey: () => storedPasskey }));
await jest.unstable_mockModule('../../../services/walletCrypto/passkey', () => ({ passkeyRecordAddress: () => passkeyAddress }));
await jest.unstable_mockModule('../../../services/authTokenStore', () => ({
  getAuthToken: () => token,
  subscribeAuthToken: () => () => undefined,
}));
await jest.unstable_mockModule('../../../services/walletJwtSubject', () => ({ readJwtSubject: () => subject }));
await jest.unstable_mockModule('@mui/material', () => ({
  Box: ({ children, ...rest }: { children?: React.ReactNode; 'data-testid'?: string }) =>
    React.createElement('div', { 'data-testid': rest['data-testid'] }, children),
}));
await jest.unstable_mockModule('../../DesignSystem', () => ({
  WrfButton: ({ children, onClick, disabled }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean }) =>
    React.createElement('button', { onClick, disabled }, children),
  WrfInput: ({ label, value, onChange, type }: { label?: string; value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; type?: string }) =>
    React.createElement('input', { 'aria-label': label, value, onChange, type }),
  WrfAlert: ({ children, title, ...rest }: { children?: React.ReactNode; title?: string; 'data-testid'?: string }) =>
    React.createElement('div', { role: 'alert', 'data-testid': rest['data-testid'] }, title && React.createElement('strong', null, title), children),
}));
await jest.unstable_mockModule('../../../services/apiClient', () => ({
  stationRegistrationService: { submitStationOwnershipProof, getStationChainRegistration },
}));

const { StationChainRegistrationNotice, StationChainRegistrationCard, describeProofRejection } =
  await import('../StationChainRegistration');

const reg = (state: string, extra: Record<string, unknown> = {}) =>
  ({ state, stationId: STATION, chainId: '888', networkId: 'testnet', ...extra }) as never;
const onChanged = jest.fn();
const notice = (registration: never, signer?: { sign: jest.Mock; release: jest.Mock }) =>
  render(<StationChainRegistrationNotice registration={registration} ownerAddress={OWNER} signer={signer as never} onChanged={onChanged} />);
const memoryWallet = () => ({ sign: jest.fn(() => PROOF), release: jest.fn() });

beforeEach(() => {
  vaultAddress = null;
  storedPasskey = null;
  token = null;
  subject = null;
  for (const mock of [submitStationOwnershipProof, getStationChainRegistration, withOwnerKey, signStationOwnership, onChanged]) mock.mockReset();
});
afterEach(() => cleanup());

describe('states that need nothing from the owner', () => {
  it('waiting for a batch: connected, not earning yet, done in batches, nothing to do', () => {
    notice(reg('waiting', { waitingFor: 'batch' }));
    const el = screen.getByTestId('station-chain-waiting');
    expect(el).toHaveTextContent('Connected. Waiting for on-chain registration');
    expect(el).toHaveTextContent(/isn.t earning yet/);
    expect(el).toHaveTextContent('in batches');
    expect(el).toHaveTextContent(/You don.t need to do anything/);
  });

  it('waiting for the station to report: says so and what to check', () => {
    notice(reg('waiting', { waitingFor: 'station_report' }));
    const el = screen.getByTestId('station-chain-waiting-report');
    expect(el).toHaveTextContent('Waiting for your station to report');
    expect(el).toHaveTextContent('a reading in the last 24 hours');
    expect(el).toHaveTextContent(/isn.t earning yet/);
  });

  it('waiting for the operator: an id made from a name is added by hand, and how to skip the wait', () => {
    notice(reg('waiting', { waitingFor: 'operator_review' }));
    const el = screen.getByTestId('station-chain-waiting-operator');
    expect(el).toHaveTextContent('public on the chain for good');
    expect(el).toHaveTextContent('reconnect the station');
  });

  it('earning', () => {
    notice(reg('earning'));
    expect(screen.getByTestId('station-chain-earning')).toHaveTextContent('registered on chain');
  });

  it('blocked: the id is taken on chain, it is not earning, and the way out is to reconnect', () => {
    notice(reg('blocked', { blockedReason: 'station_id_taken_on_chain' }));
    const el = screen.getByTestId('station-chain-blocked');
    expect(el).toHaveTextContent('already used on chain by another wallet');
    expect(el).toHaveTextContent('not earning');
    expect(el).toHaveTextContent('Reconnect the station on the Connect page to get a new id');
  });

  it('blocked: the chain shows the station as not active', () => {
    notice(reg('blocked', { blockedReason: 'chain_record_not_active' }));
    expect(screen.getByTestId('station-chain-blocked')).toHaveTextContent('shows it as not active');
  });

  it('none of these offers a sign button or sends anything', () => {
    for (const r of [reg('waiting', { waitingFor: 'batch' }), reg('earning'), reg('blocked', { blockedReason: 'station_id_taken_on_chain' })]) {
      vaultAddress = OWNER;
      notice(r, memoryWallet() as never);
      expect(screen.queryByText('Sign for my station')).toBeNull();
      cleanup();
    }
    expect(submitStationOwnershipProof).not.toHaveBeenCalled();
  });
});

describe('one step left: the owner signs', () => {
  it('says plainly what becomes public for good, before any button', () => {
    vaultAddress = OWNER;
    notice(reg('needs_owner_signature'));
    const warning = screen.getByTestId('station-chain-public-warning');
    expect(warning).toHaveTextContent('What becomes public, permanently');
    expect(warning).toHaveTextContent(`the station id (${STATION})`);
    expect(warning).toHaveTextContent('position rounded to 0.1 degree');
    expect(warning).toHaveTextContent(/can.t be removed later/);
    expect(screen.getByTestId('station-chain-needs-signature')).toHaveTextContent('moves no coins');
  });

  it('a wallet saved in this browser: asks for the password, signs for this station and the server\'s chain, then refreshes', async () => {
    vaultAddress = OWNER;
    const account = { address: OWNER };
    withOwnerKey.mockImplementation(async (_owner, _password, run) => (run as (a: unknown) => unknown)(account));
    signStationOwnership.mockReturnValue(PROOF);
    submitStationOwnershipProof.mockResolvedValue(reg('waiting'));
    notice(reg('needs_owner_signature'));
    expect(screen.getByText('Sign for my station')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByText('Sign for my station'));
    await waitFor(() => expect(submitStationOwnershipProof).toHaveBeenCalledWith(STATION, PROOF));
    expect(withOwnerKey.mock.calls[0][0]).toBe(OWNER);
    expect(signStationOwnership).toHaveBeenCalledWith(account, STATION, { chainId: '888', networkId: 'testnet' });
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  });

  it('a wrong password signs and sends nothing', async () => {
    vaultAddress = OWNER;
    withOwnerKey.mockRejectedValue(new Error('unlock failed'));
    notice(reg('needs_owner_signature'));
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByText('Sign for my station'));
    expect(await screen.findByText('That password did not unlock your 12-word wallet. Nothing was signed.')).toBeInTheDocument();
    expect(submitStationOwnershipProof).not.toHaveBeenCalled();
  });

  it('a brand-new wallet still in memory: signs once without asking, and is released only after the server accepts', async () => {
    const wallet = memoryWallet();
    let accept: (v: unknown) => void = () => undefined;
    submitStationOwnershipProof.mockReturnValue(new Promise((resolve) => { accept = resolve; }));
    notice(reg('needs_owner_signature'), wallet);
    await waitFor(() => expect(submitStationOwnershipProof).toHaveBeenCalledWith(STATION, PROOF));
    expect(wallet.sign).toHaveBeenCalledWith(STATION, { chainId: '888', networkId: 'testnet' });
    // Not accepted yet: the wallet is still held.
    expect(wallet.release).not.toHaveBeenCalled();
    accept(reg('waiting'));
    await waitFor(() => expect(wallet.release).toHaveBeenCalledTimes(1));
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(wallet.sign).toHaveBeenCalledTimes(1);
  });

  it('a brand-new wallet whose hand-in fails for a passing reason keeps the wallet and can try again', async () => {
    const wallet = memoryWallet();
    submitStationOwnershipProof.mockRejectedValueOnce(new MockApiError('down', 503)).mockResolvedValue(reg('waiting'));
    notice(reg('needs_owner_signature'), wallet);
    expect(await screen.findByText('Your signature could not be saved just now. Please try again.')).toBeInTheDocument();
    expect(wallet.release).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Try again'));
    await waitFor(() => expect(submitStationOwnershipProof).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(wallet.release).toHaveBeenCalledTimes(1));
  });

  it('a refused signature shows the reason and does not offer the same try again', async () => {
    const wallet = memoryWallet();
    submitStationOwnershipProof.mockRejectedValue(new MockApiError('bad', 400, { code: 'OWNERSHIP_SIGNATURE_INVALID' }));
    notice(reg('needs_owner_signature'), wallet);
    const failure = await screen.findByTestId('station-chain-failure');
    expect(failure).toHaveTextContent('The server did not accept the signature (it checks stations for chain 888)');
    expect(failure).toHaveTextContent('Reload this page and sign again');
    expect(screen.queryByText('Try again')).toBeNull();
    expect(submitStationOwnershipProof).toHaveBeenCalledTimes(1);
  });

  it('no saved wallet for this owner in this browser: points to this station\'s page, offers no button', () => {
    notice(reg('needs_owner_signature'));
    const el = screen.getByTestId('station-chain-no-wallet-here');
    expect(el).toHaveTextContent(/Open this station.s page in the browser where that wallet is saved/);
    expect(screen.queryByText('Sign for my station')).toBeNull();
  });

  it('a passkey-owned station gets its own state, never "restore your 12 words"', () => {
    storedPasskey = { credentialId: 'x' };
    passkeyAddress = OWNER;
    notice(reg('needs_owner_signature'));
    const el = screen.getByTestId('station-chain-passkey-owned');
    expect(el).toHaveTextContent(/Passkey-owned stations can.t be registered on chain yet/);
    expect(el).toHaveTextContent(/you don.t need to do anything/);
    expect(screen.queryByTestId('station-chain-no-wallet-here')).toBeNull();
    expect(screen.queryByText(/12 words/)).toBeNull();
    expect(screen.queryByText('Sign for my station')).toBeNull();
  });

  it('a passkey saved here that is NOT this station\'s owner changes nothing', () => {
    storedPasskey = { credentialId: 'x' };
    passkeyAddress = `0x${'12'.repeat(20)}`;
    notice(reg('needs_owner_signature'));
    expect(screen.queryByTestId('station-chain-passkey-owned')).toBeNull();
    expect(screen.getByTestId('station-chain-no-wallet-here')).toBeInTheDocument();
  });

  it('refuses to sign when the server registers stations on another chain, and says whose problem it is', async () => {
    vaultAddress = OWNER;
    const wallet = memoryWallet();
    for (const r of [reg('needs_owner_signature', { chainId: '777' }), reg('needs_owner_signature', { networkId: 'mainnet' })]) {
      notice(r, wallet);
      const el = screen.getByTestId('station-chain-mismatch');
      expect(el).toHaveTextContent('this site is built for chain 888 (testnet)');
      expect(el).toHaveTextContent('Nothing was signed');
      expect(el).toHaveTextContent('not with your station or wallet');
      expect(screen.queryByText('Sign for my station')).toBeNull();
      cleanup();
    }
    await Promise.resolve();
    expect(wallet.sign).not.toHaveBeenCalled();
    expect(submitStationOwnershipProof).not.toHaveBeenCalled();
  });
});

describe('describeProofRejection', () => {
  it('names the wallet problem, the chain problem, a lost session, and treats only passing failures as retryable', () => {
    expect(describeProofRejection(new MockApiError('x', 409, { code: 'OWNER_KEY_NOT_THIS_WALLET' }), '888'))
      .toMatchObject({ retry: false, message: expect.stringContaining('not the wallet signed in on this site') });
    expect(describeProofRejection(new MockApiError('x', 400, { error: { code: 'OWNERSHIP_SIGNATURE_INVALID' } }), '888').retry).toBe(false);
    expect(describeProofRejection(new MockApiError('x', 404), '888'))
      .toMatchObject({ retry: false, message: expect.stringContaining('not registered to the wallet signed in') });
    expect(describeProofRejection(new MockApiError('x', 401), '888').message).toContain('session ended');
    expect(describeProofRejection(new MockApiError('x', 503), '888').retry).toBe(true);
    expect(describeProofRejection(new Error('network'), '888').retry).toBe(true);
  });
});

describe('StationChainRegistrationCard (the owner\'s station page)', () => {
  const ALIAS = 'st_0123456789ab';

  it('signed out: nothing is shown and nothing is asked', async () => {
    const { container } = render(<StationChainRegistrationCard stationId={ALIAS} />);
    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
    expect(getStationChainRegistration).not.toHaveBeenCalled();
  });

  it('the owner sees the status, and the sign step when it is missing', async () => {
    token = 'jwt';
    subject = OWNER;
    vaultAddress = OWNER;
    getStationChainRegistration.mockResolvedValue({ ownerAddress: OWNER, chainRegistration: reg('needs_owner_signature') });
    render(<StationChainRegistrationCard stationId={ALIAS} />);
    expect(await screen.findByTestId('station-chain-needs-signature')).toBeInTheDocument();
    expect(getStationChainRegistration).toHaveBeenCalledWith(ALIAS);
    expect(screen.getByText('Sign for my station')).toBeInTheDocument();
  });

  it('after signing here the card reads the state again and shows waiting', async () => {
    token = 'jwt';
    subject = OWNER;
    vaultAddress = OWNER;
    getStationChainRegistration
      .mockResolvedValueOnce({ ownerAddress: OWNER, chainRegistration: reg('needs_owner_signature') })
      .mockResolvedValue({ ownerAddress: OWNER, chainRegistration: reg('waiting', { waitingFor: 'batch' }) });
    withOwnerKey.mockResolvedValue(PROOF);
    submitStationOwnershipProof.mockResolvedValue(reg('waiting'));
    render(<StationChainRegistrationCard stationId={ALIAS} />);
    await screen.findByTestId('station-chain-needs-signature');
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByText('Sign for my station'));
    expect(await screen.findByTestId('station-chain-waiting')).toBeInTheDocument();
  });

  it('somebody else\'s station, a backend that reports nothing, or a failed read: nothing is shown', async () => {
    token = 'jwt';
    subject = OWNER;
    for (const answer of [
      { ownerAddress: `0x${'99'.repeat(20)}`, chainRegistration: reg('waiting') },
      { ownerAddress: OWNER, chainRegistration: null },
    ]) {
      getStationChainRegistration.mockResolvedValue(answer);
      const { container } = render(<StationChainRegistrationCard stationId={ALIAS} />);
      await waitFor(() => expect(getStationChainRegistration).toHaveBeenCalled());
      await Promise.resolve();
      expect(container).toBeEmptyDOMElement();
      cleanup();
      getStationChainRegistration.mockReset();
    }
    getStationChainRegistration.mockRejectedValue(new MockApiError('nope', 404));
    const { container } = render(<StationChainRegistrationCard stationId={ALIAS} />);
    await waitFor(() => expect(getStationChainRegistration).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
