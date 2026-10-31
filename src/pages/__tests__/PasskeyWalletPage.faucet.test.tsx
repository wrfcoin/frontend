/** @jest-environment jsdom */
/**
 * "Get test coins" on the passkey wallet page: the public onboarding faucet (sum question, then claim to
 * the passkey address) through the real StationRegistrationService and ApiClient, with fetch stubbed.
 * Also the creation choice: the default passkey and "Use a security key (YubiKey)".
 */
import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const record = { credentialId: new Uint8Array(16).fill(7), publicKeyXY: new Uint8Array(64).fill(9), rpId: 'localhost' };
let stored: typeof record | null = record;
const getBalance = jest.fn<(a: string) => Promise<{ units: string; height: number }>>();
const registerPasskey = jest.fn<(...args: unknown[]) => Promise<typeof record>>();

await jest.unstable_mockModule('../../services/walletCrypto/passkeyBalance', () => ({
  getPasskeyPublicBalance: (a: string) => getBalance(a),
}));
const actualPasskey = await import('../../services/walletCrypto/passkey');
await jest.unstable_mockModule('../../services/walletCrypto/passkey', () => ({
  ...actualPasskey,
  registerPasskey: (...args: unknown[]) => registerPasskey(...args),
}));
await jest.unstable_mockModule('../../hooks/usePublicTestnetStats', () => ({ default: () => ({ blockHeight: 4210 }) }));
await jest.unstable_mockModule('../../config/network', () => ({ WRFCOIN_CHAIN_ID: 777 }));
await jest.unstable_mockModule('../../services/walletCrypto/passkeySend', () => ({
  clearStoredPasskey: jest.fn(),
  getPasskeyNonce: async () => '0',
  loadStoredPasskey: () => stored,
  saveStoredPasskey: jest.fn(),
  submitPasskeyTransfer: jest.fn(),
}));
const { default: PasskeyWalletPage, SECURITY_KEY_NOTE, SECURITY_KEY_UNSUPPORTED_MESSAGE, UNSUPPORTED_MESSAGE } = await import('../PasskeyWalletPage');
const { FAUCET_MESSAGES, describeFaucetFailure, shortTxHash } = await import('../../components/wallet/PasskeyFaucetPanel');
const { setAuthToken, clearAuthToken } = await import('../../services/authTokenStore');
const address = actualPasskey.passkeyRecordAddress(record as any);

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };
let calls: Call[] = [];
type Reply = { status: number; body: unknown } | 'network';
let replies: Reply[] = [];

function reply(r: Reply) {
  if (r === 'network') return Promise.reject(new TypeError('Failed to fetch'));
  const text = JSON.stringify(r.body);
  return Promise.resolve({
    ok: r.status >= 200 && r.status < 300,
    status: r.status,
    text: async () => text,
    json: async () => JSON.parse(text),
  } as unknown as Response);
}

const env = globalThis as any;
let previousEnv: unknown;
beforeEach(() => {
  stored = record;
  calls = []; replies = [];
  getBalance.mockReset(); registerPasskey.mockReset();
  getBalance.mockResolvedValue({ units: '0', height: 4209 });
  previousEnv = env.__VITE_ENV__;
  env.__VITE_ENV__ = { ...(env.__VITE_ENV__ ?? {}), VITE_FAUCET_OPEN: 'true' };
  globalThis.fetch = jest.fn((input: any, init: any = {}) => {
    calls.push({
      url: String(input), method: init.method ?? 'GET', headers: { ...(init.headers ?? {}) },
      body: init.body ? JSON.parse(init.body) : undefined,
    });
    const next = replies.shift();
    if (!next) throw new Error(`unexpected fetch ${String(input)}`);
    return reply(next);
  }) as any;
  // A wallet session token in the store must NOT ride along on the public faucet routes.
  setAuthToken('session-token-that-must-not-leak');
});
afterEach(() => { cleanup(); clearAuthToken(); env.__VITE_ENV__ = previousEnv; jest.useRealTimers(); });

const QUESTION = { status: 200, body: { challengeId: 'c-1', question: 'What is 3 + 4?', disclaimer: 'testnet' } };

async function askQuestion() {
  fireEvent.click(await screen.findByTestId('passkey-faucet-start'));
  expect(await screen.findByTestId('passkey-faucet-question')).toHaveTextContent('What is 3 + 4?');
}
async function answer(value: string) {
  fireEvent.change(screen.getByTestId('passkey-faucet-answer'), { target: { value } });
  fireEvent.click(screen.getByTestId('passkey-faucet-claim'));
}

describe('passkey wallet: get test coins', () => {
  it('shows the sum, claims to the passkey address without a login header, then re-reads the balance', async () => {
    replies = [QUESTION, { status: 200, body: { txHash: '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789', amount: '100', balance: '999999', disclaimer: 'testnet' } }];
    getBalance.mockResolvedValueOnce({ units: '0', height: 4209 }).mockResolvedValue({ units: '10000000000', height: 4211 });
    render(<PasskeyWalletPage />);
    expect(await screen.findByText('0.00000000 WRF')).toBeInTheDocument();
    await askQuestion();
    await answer(' 7 ');

    const success = await screen.findByTestId('passkey-faucet-success');
    expect(success).toHaveTextContent('100 WRF test coins are on the way.');
    expect(success).toHaveTextContent('Transaction 0xabcdef01…456789.');
    expect(calls.map(c => `${c.method} ${c.url}`)).toEqual(['POST /api/onboarding/faucet/challenge', 'POST /api/onboarding/faucet/claim']);
    expect(calls[1].body).toEqual({ walletAddress: address, challengeId: 'c-1', answer: '7' });
    for (const c of calls) expect(Object.keys(c.headers).map(h => h.toLowerCase())).not.toContain('authorization');

    // The balance comes from the public balance read only, refreshed after the claim; never the faucet's own `balance`.
    expect(await screen.findByText('100.00000000 WRF')).toBeInTheDocument();
    expect(getBalance).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/999999|9,999.99/)).not.toBeInTheDocument();
  });

  it('reads the balance again once the next blocks have had time to include the claim', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick', 'setImmediate'] });
    replies = [QUESTION, { status: 200, body: { txHash: '0x' + 'ab'.repeat(32), amount: '100' } }];
    render(<PasskeyWalletPage />);
    await askQuestion();
    await answer('7');
    await screen.findByTestId('passkey-faucet-success');
    await waitFor(() => expect(getBalance).toHaveBeenCalledTimes(2));
    await act(async () => { jest.advanceTimersByTime(15_000); });
    await waitFor(() => expect(getBalance).toHaveBeenCalledTimes(3));
  });

  it.each([
    [{ status: 429, body: { error: { code: 'ALREADY_CLAIMED', message: 'This address has already claimed tokens within the last 24 hours' } } }, FAUCET_MESSAGES.ALREADY_CLAIMED],
    [{ status: 429, body: { error: { code: 'RATE_LIMITED', message: 'Too many claims from this IP address.' } } }, FAUCET_MESSAGES.RATE_LIMITED],
    [{ status: 503, body: { error: { code: 'FAUCET_EMPTY', message: 'Faucet temporarily unavailable' } } }, FAUCET_MESSAGES.FAUCET_EMPTY],
    ['network' as const, FAUCET_MESSAGES.NETWORK],
    [{ status: 500, body: { error: { code: 'INTERNAL', message: 'stack trace here' } } }, FAUCET_MESSAGES.OTHER],
  ])('a failed claim (%j) says so in plain words and shows no success or new balance', async (failure, message) => {
    replies = [QUESTION, failure];
    render(<PasskeyWalletPage />);
    await screen.findByText('0.00000000 WRF');
    await askQuestion();
    await answer('7');
    expect(await screen.findByTestId('passkey-faucet-error')).toHaveTextContent(message);
    expect(screen.queryByTestId('passkey-faucet-success')).not.toBeInTheDocument();
    expect(screen.queryByText(/stack trace/)).not.toBeInTheDocument();
    expect(getBalance).toHaveBeenCalledTimes(1);
    expect(screen.getByText('0.00000000 WRF')).toBeInTheDocument();
    expect(screen.getByTestId('passkey-faucet-start')).toHaveTextContent('Try again');
  });

  it('a wrong answer gets a fresh question (the server spends each one)', async () => {
    replies = [QUESTION, { status: 400, body: { error: { code: 'CAPTCHA_FAILED', message: 'Incorrect captcha answer' } } },
      { status: 200, body: { challengeId: 'c-2', question: 'What is 5 + 1?' } }];
    render(<PasskeyWalletPage />);
    await askQuestion();
    await answer('8');
    expect(await screen.findByTestId('passkey-faucet-error')).toHaveTextContent(FAUCET_MESSAGES.CAPTCHA_FAILED);
    expect(await screen.findByText('What is 5 + 1?')).toBeInTheDocument();
    expect(calls.map(c => c.url)).toEqual(['/api/onboarding/faucet/challenge', '/api/onboarding/faucet/claim', '/api/onboarding/faucet/challenge']);
  });

  it('a question that cannot be loaded says so, including rate limiting', async () => {
    replies = [{ status: 429, body: { error: { code: 'RATE_LIMITED', message: 'Too many captcha requests' } } }];
    render(<PasskeyWalletPage />);
    fireEvent.click(await screen.findByTestId('passkey-faucet-start'));
    expect(await screen.findByTestId('passkey-faucet-error')).toHaveTextContent(FAUCET_MESSAGES.RATE_LIMITED);
    replies = ['network'];
    fireEvent.click(screen.getByTestId('passkey-faucet-start'));
    await waitFor(() => expect(screen.getByTestId('passkey-faucet-error')).toHaveTextContent(FAUCET_MESSAGES.NETWORK));
  });

  it('offers no claim while the build says the faucet is not funded', async () => {
    env.__VITE_ENV__ = { ...(env.__VITE_ENV__ ?? {}), VITE_FAUCET_OPEN: 'false' };
    render(<PasskeyWalletPage />);
    expect(await screen.findByTestId('passkey-faucet-closed')).toHaveTextContent('no test coins to give out yet');
    expect(screen.queryByTestId('passkey-faucet-start')).not.toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('is not shown before a passkey account exists', () => {
    stored = null;
    render(<PasskeyWalletPage />);
    expect(screen.queryByTestId('passkey-faucet')).not.toBeInTheDocument();
  });

  it('maps codes and statuses without trusting server wording', () => {
    expect(describeFaucetFailure({ code: 'EVM_ADDRESS_REQUIRED', status: 400 })).toBe(FAUCET_MESSAGES.BAD_ADDRESS);
    expect(describeFaucetFailure({ status: 429 })).toBe(FAUCET_MESSAGES.RATE_LIMITED);
    expect(describeFaucetFailure({ status: 503 })).toBe(FAUCET_MESSAGES.FAUCET_EMPTY);
    expect(describeFaucetFailure({ status: 0 })).toBe(FAUCET_MESSAGES.NETWORK);
    expect(shortTxHash('0x1234')).toBe('0x1234');
  });
});

describe('passkey wallet: creation choice', () => {
  beforeEach(() => { stored = null; });

  it('keeps the browser-chosen default and offers a labelled security-key option with its warning', async () => {
    registerPasskey.mockResolvedValue(record);
    render(<PasskeyWalletPage />);
    expect(screen.getByTestId('passkey-security-key-note')).toHaveTextContent(SECURITY_KEY_NOTE);
    expect(SECURITY_KEY_NOTE).toMatch(/physical key, a touch and its PIN/);
    expect(SECURITY_KEY_NOTE).toMatch(/no recovery yet/);
    fireEvent.click(screen.getByRole('button', { name: 'Create passkey account' }));
    await screen.findByTestId('passkey-address');
    expect(registerPasskey).toHaveBeenCalledWith('localhost', 'WRFCoin passkey wallet', undefined, 'any');
  });

  it('"Use a security key (YubiKey)" asks for a roaming key', async () => {
    registerPasskey.mockResolvedValue(record);
    render(<PasskeyWalletPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Use a security key (YubiKey)' }));
    await screen.findByTestId('passkey-address');
    expect(registerPasskey).toHaveBeenCalledWith('localhost', 'WRFCoin passkey wallet', undefined, 'security-key');
  });

  it('a security key that cannot be used gets key-specific advice; the default keeps its own', async () => {
    registerPasskey.mockRejectedValue(Object.assign(new Error('nope'), { name: 'InvalidStateError' }));
    render(<PasskeyWalletPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Use a security key (YubiKey)' }));
    expect(await screen.findByText(SECURITY_KEY_UNSUPPORTED_MESSAGE)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create passkey account' }));
    expect(await screen.findByText(UNSUPPORTED_MESSAGE)).toBeInTheDocument();
  });
});
