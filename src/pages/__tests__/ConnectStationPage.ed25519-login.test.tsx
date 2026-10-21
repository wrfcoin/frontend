/**
 * @jest-environment jsdom
 *
 * ConnectStationPage creates a first-party ed25519 wallet and logs in with the
 * ed25519 flow (frontend#373 / backend#1208), never an ethers secp256k1
 * signer. The login subject — and so the backend station owner — is the
 * wallet's lowercase core4 chain address.
 */
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createPublicKey, verify as nodeVerify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// core4#3234 key-scheme vector, shared with backend#1208 and mobile.
// Challenge timestamps relative to now: the client refuses expired challenges.
const ISSUED_AT = new Date(Date.now() - 1_000).toISOString();
const EXPIRES_AT = new Date(Date.now() + 5 * 60_000).toISOString();

const vector = JSON.parse(
  readFileSync(resolve(process.cwd(), 'contract-fixtures/wallet-key-scheme-vector.json'), 'utf8'),
) as { mnemonic: string; ed25519_public_key_hex: string; address: string };
const VECTOR_SUB = '0x3f995ceb27e8177077dbed8b1e4f696af74da492';
const ORIGIN = 'https://wrfcoin-testnet.taila1c049.ts.net';
const EXPECT = { origin: ORIGIN, chainId: '777', network: 'testnet' };

const loginWithEd25519Mock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const loginWithSignerMock = jest.fn();

await jest.unstable_mockModule('react-router', () => ({
  useNavigate: () => jest.fn(),
}));

await jest.unstable_mockModule('@mui/material', () => {
  const pass = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children);
  return {
    Box: pass,
    Stepper: pass,
    Step: pass,
    StepLabel: pass,
    Typography: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('span', null, children),
    CircularProgress: () => React.createElement('span', null, 'Loading'),
    Chip: ({ label }: { label?: React.ReactNode }) => React.createElement('span', null, label),
  };
});

await jest.unstable_mockModule('../../components/DesignSystem', () => ({
  WrfButton: ({
    children,
    onClick,
    disabled,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => React.createElement('button', { onClick, disabled }, children),
  WrfCard: ({
    children,
    headerTitle,
    onClick,
  }: {
    children?: React.ReactNode;
    headerTitle?: string;
    onClick?: () => void;
  }) =>
    React.createElement(
      'div',
      { onClick, role: onClick ? 'button' : undefined, 'aria-label': headerTitle },
      children,
    ),
  WrfInput: ({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => React.createElement('input', { 'aria-label': label, value, onChange }),
  WrfAlert: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { role: 'alert' }, children),
}));

// The shared BIP-39 generator, pinned to the vector mnemonic.
await jest.unstable_mockModule('../../utils/walletUtils', () => ({
  walletManager: { generateNewMnemonic: async () => vector.mnemonic },
}));

await jest.unstable_mockModule('../../services/apiClient', () => ({
  FAUCET_DISCLAIMER: 'Experimental testnet only.',
  // The page's own-wallet hook (W28) loads the wallet provider manager, which imports walletService.
  walletService: {},
  stationRegistrationService: {
    loginWithEd25519: loginWithEd25519Mock,
    loginWithSigner: loginWithSignerMock,
    requestFaucetChallenge: jest.fn(),
    claimFaucet: jest.fn(),
    registerStation: jest.fn(),
    getStationRewardProgress: jest.fn(),
  },
}));

const { default: ConnectStationPage, createFirstPartySessionWallet } = await import(
  '../ConnectStationPage'
);
const { ed25519LoginSigner } = await import('../../services/walletCrypto/firstPartyLoginSigner');
const { ED25519_WALLET_LOGIN_DOMAIN } = await import('../../services/walletAuthService');
const { transparentTransferMessage } = await import('../../services/walletCrypto/transferPayload');

function challenge(address: string, nonce = 'ed-nonce-1'): string {
  return `${ED25519_WALLET_LOGIN_DOMAIN}\n${new URL(ORIGIN).host} wants you to sign in with your WRFCoin ed25519 account:\n${address}\n\nSign in to WRFCoin Testnet.\n\nURI: ${ORIGIN}\nVersion: 1\nScheme: ed25519\nChain ID: 777\nNetwork: testnet\nNonce: ${nonce}\nIssued At: ${ISSUED_AT}\nExpiration Time: ${EXPIRES_AT}`;
}

function verifies(pubkeyHex: string, message: string, signatureHex: string): boolean {
  const key = createPublicKey({
    key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(pubkeyHex, 'hex')]),
    format: 'der',
    type: 'spki',
  });
  return nodeVerify(null, Buffer.from(message, 'utf8'), key, Buffer.from(signatureHex, 'hex'));
}

describe('ConnectStationPage first-party ed25519 wallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('derives the vector wallet with deriveAccount: lowercase chain address + ed25519 pubkey', async () => {
    const w = await createFirstPartySessionWallet();
    expect(vector.address).toBe(VECTOR_SUB);
    expect(w.address).toBe(VECTOR_SUB);
    expect(w.publicKeyHex).toBe(vector.ed25519_public_key_hex);
    expect(w.mnemonic).toBe(vector.mnemonic);
    expect(w).not.toHaveProperty('signer');
  });

  it('login signer signs a valid challenge for THIS address (verifies under node:crypto)', async () => {
    const w = await createFirstPartySessionWallet();
    const message = challenge(VECTOR_SUB);
    const sig = ed25519LoginSigner(w.account, EXPECT)(message);
    expect(sig).toMatch(/^[0-9a-f]{128}$/);
    expect(verifies(vector.ed25519_public_key_hex, message, sig)).toBe(true);
  });

  it('login signer refuses server bytes that are not a login challenge, before touching the key', async () => {
    const w = await createFirstPartySessionWallet();
    const signSpy = jest.spyOn(w.account, 'sign');
    const signer = ed25519LoginSigner(w.account, EXPECT);
    const transferPreimage = new TextDecoder().decode(
      transparentTransferMessage({
        chainId: '777',
        networkId: 'testnet',
        from: VECTOR_SUB,
        to: '0x1111111111111111111111111111111111111111',
        amountBaseUnits: 547599908735n,
        nonce: 1n,
      }),
    );
    expect(() => signer(transferPreimage)).toThrow(/Refusing to sign/);
    expect(() => signer(challenge('0x1111111111111111111111111111111111111111'))).toThrow(
      /different address/,
    );
    expect(() => signer(`WRFCoin wallet login nonce: abc`)).toThrow(/Refusing to sign/);
    // Default expectations (no chain/network configured) fail closed too.
    expect(() => ed25519LoginSigner(w.account)(challenge(VECTOR_SUB))).toThrow(/Refusing to sign/);
    expect(signSpy).not.toHaveBeenCalled();
  });

  it('wizard logs the new wallet in via loginWithEd25519 with the vector address; no ethers signer path', async () => {
    loginWithEd25519Mock.mockResolvedValue({ token: 'jwt', address: VECTOR_SUB, expiresIn: 900 });
    render(<ConnectStationPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Create a new wallet' }));
    fireEvent.click(screen.getByText('Generate Wallet'));
    await screen.findByText(/I have securely backed up/);
    fireEvent.click(screen.getByRole('checkbox'));

    const words = vector.mnemonic.split(' ');
    for (const input of screen.getAllByLabelText(/^Word #\d+$/)) {
      const n = Number(input.getAttribute('aria-label')!.replace('Word #', ''));
      fireEvent.change(input, { target: { value: words[n - 1] } });
    }
    fireEvent.click(screen.getByRole('button', { name: /Confirm & Continue/ }));

    await waitFor(() => expect(loginWithEd25519Mock).toHaveBeenCalledTimes(1));
    const [address, pubkey, sign] = loginWithEd25519Mock.mock.calls[0];
    expect(address).toBe(VECTOR_SUB);
    expect(pubkey).toBe(vector.ed25519_public_key_hex);
    expect(typeof sign).toBe('function');
    expect(loginWithSignerMock).not.toHaveBeenCalled();
    // The signer handed to the login flow is the validating one: it refuses
    // anything that is not a login challenge.
    expect(() => (sign as (m: string) => string)('not a challenge')).toThrow(/Refusing to sign/);
    // Next step (Fund) shows the same lowercase ed25519 address as the owner.
    expect(await screen.findByText(VECTOR_SUB)).toBeInTheDocument();
  });

  it('tells the user the wallet is not saved in the app and the phrase is the only recovery', async () => {
    render(<ConnectStationPage />);
    expect(
      screen.getByText(/This wallet is not saved in this app or in your browser\. After you leave this page, your 12-word recovery phrase is the only way to recover it\./),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create a new wallet' }));
    fireEvent.click(screen.getByText('Generate Wallet'));
    await screen.findByText(/I have securely backed up/);
    expect(
      screen.getByText(/This wallet is not saved in this app or in your\s+browser: the recovery phrase is the only way to recover it\./),
    ).toBeInTheDocument();
  });

  it('only the chain address leaves WalletStep; the signing account never reaches page state or context', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/pages/ConnectStationPage.tsx'), 'utf8');
    const code = src
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .join('\n');
    // The callback carries a string address, and WalletStep passes exactly that.
    expect(code).toMatch(/onAuthenticated: \(address: string\) => void;/);
    expect(code).toMatch(/onAuthenticated\(createWallet\.address\)/);
    // Page root keeps only the address: no SessionWallet / account in its body.
    const root = code.slice(code.indexOf('export default function ConnectStationPage'));
    expect(root.length).toBeGreaterThan(100);
    expect(root).toMatch(/useState<string>\(''\)/);
    expect(root).not.toMatch(/SessionWallet|\baccount\b|mnemonic/);
    // The account is used in exactly one place: handed to the validating login signer.
    expect(code.match(/\.account\b/g)).toEqual(['.account']);
    expect(code).toMatch(/ed25519LoginSigner\(createWallet\.account\)/);
    // No React context/provider through which it could escape.
    expect(code).not.toMatch(/createContext|useContext|\.Provider\b|<\w+Provider\b/);
  });

  it('page source has no ethers signer / EVM signMessage login path left', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/pages/ConnectStationPage.tsx'), 'utf8');
    const code = src
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .join('\n');
    expect(code).not.toMatch(/from 'ethers'/);
    expect(code).not.toMatch(/Wallet\.createRandom|HDNodeWallet|signMessage|loginWithSigner/);
    expect(code).toMatch(/deriveAccount\(/);
    expect(code).toMatch(/loginWithEd25519\(/);
  });
});
