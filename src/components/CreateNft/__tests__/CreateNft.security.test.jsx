/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

const mockCreateNFT = jest.fn();
const mockGetCurrentWallet = jest.fn();
const mockSignMessage = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();

await jest.unstable_mockModule('../../../services/api.ts', () => ({
  nftAPI: {
    createNFT: (...args) => mockCreateNFT(...args),
  },
}));

await jest.unstable_mockModule('../../DesignSystem/index.ts', () => ({
  WrfCard: ({ title, children }) => (
    <div>
      <h3>{title}</h3>
      {children}
    </div>
  ),
  WrfSelect: ({ label, value, onChange, options }) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={event => onChange(event.target.value)}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

await jest.unstable_mockModule(
  '../../../services/walletProviders/WalletProviderManager.js',
  () => ({
    walletProviderManager: {
      getCurrentWallet: (...args) => mockGetCurrentWallet(...args),
      signNftCreate: (...args) => mockSignMessage(...args),
      on: (...args) => mockOn(...args),
      off: (...args) => mockOff(...args),
    },
  }),
);

// Real first-party provider for the ed25519 end-to-end case; its own heavy
// dependencies are stubbed (they are not used for signing).
await jest.unstable_mockModule('../../../utils/walletUtils.ts', () => ({ walletManager: { currentWallet: null } }));
await jest.unstable_mockModule('../../../services/secureWalletStorage.ts', () => ({ getSecureWallet: jest.fn() }));
await jest.unstable_mockModule('../../../services/apiClient/index.ts', () => ({ walletService: {} }));

const { default: CreateNft } = await import('../CreateNft.jsx');
const { CustomWalletProvider } = await import('../../../services/walletProviders/CustomWalletProvider.js');
const { ed25519 } = await import('@noble/curves/ed25519.js');

describe('CreateNft provider signing flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentWallet.mockReturnValue(null);
  });

  it('removes raw private-key entry UI and shows provider-signing guidance', () => {
    render(<CreateNft />);

    expect(screen.queryByLabelText(/Your Private Key/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Raw private key entry is disabled for security/i),
    ).toBeInTheDocument();
  });

  it('requires a connected wallet provider before enabling NFT creation', () => {
    render(<CreateNft />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Weather NFT' },
    });

    expect(
      screen.getByRole('button', { name: /Create NFT/i }),
    ).toBeDisabled();
  });

  it('keeps create action disabled for whitespace-only name values', () => {
    mockGetCurrentWallet.mockReturnValue({
      account: '0xabc123',
      type: 'metamask',
      connected: true,
    });
    render(<CreateNft />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: '   ' },
    });

    expect(
      screen.getByRole('button', { name: /Create NFT/i }),
    ).toBeDisabled();
  });

  it('signs mint payload with provider and submits signed request to API', async () => {
    mockGetCurrentWallet.mockReturnValue({
      account: '0xabc123',
      type: 'metamask',
      connected: true,
    });
    mockSignMessage.mockResolvedValue('0xsignedpayload');
    mockCreateNFT.mockResolvedValue({
      id: 'nft_1',
      name: 'Weather NFT',
      creation_tx: '0xminttx',
    });

    render(<CreateNft />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Weather NFT' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create NFT/i }));

    await waitFor(() => {
      expect(mockSignMessage).toHaveBeenCalledTimes(1);
    });
    expect(mockCreateNFT).toHaveBeenCalledTimes(1);

    const apiPayload = mockCreateNFT.mock.calls[0][0];
    expect(apiPayload.creator).toBe('0xabc123');
    expect(apiPayload.signature).toBe('0xsignedpayload');
    expect(apiPayload.signingPayload).toContain('"action":"wrfcoin.nft.create"');
    expect(apiPayload.privateKey).toBeUndefined();

    await waitFor(() => {
      expect(screen.getByText(/NFT Created Successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/0xminttx/i)).toBeInTheDocument();
    });
  });

  it('shows explicit error when provider signing fails', async () => {
    mockGetCurrentWallet.mockReturnValue({
      account: '0xabc123',
      type: 'metamask',
      connected: true,
    });
    mockSignMessage.mockRejectedValue(new Error('Provider signing failed'));

    render(<CreateNft />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Weather NFT' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create NFT/i }));

    await waitFor(() => {
      expect(screen.getByText(/NFT Creation Failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Wallet signing failed. Approve the signature request and try again./i,
        ),
      ).toBeInTheDocument();
    });
    expect(mockCreateNFT).not.toHaveBeenCalled();
  });

  it('fails closed when provider returns an invalid signature', async () => {
    mockGetCurrentWallet.mockReturnValue({
      account: '0xabc123',
      type: 'metamask',
      connected: true,
    });
    mockSignMessage.mockResolvedValue('short');

    render(<CreateNft />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Weather NFT' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create NFT/i }));

    await waitFor(() => {
      expect(screen.getByText(/NFT Creation Failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Wallet signing failed. Approve the signature request and try again./i,
        ),
      ).toBeInTheDocument();
    });
    expect(mockCreateNFT).not.toHaveBeenCalled();
  });

  it('shows generic API failure message when mint request fails', async () => {
    mockGetCurrentWallet.mockReturnValue({
      account: '0xabc123',
      type: 'metamask',
      connected: true,
    });
    mockSignMessage.mockResolvedValue('0xsignedpayload');
    mockCreateNFT.mockRejectedValue(new Error('upstream 500'));

    render(<CreateNft />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Weather NFT' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create NFT/i }));

    await waitFor(() => {
      expect(screen.getByText(/NFT Creation Failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Failed to create NFT. Please try again./i),
      ).toBeInTheDocument();
    });
  });

  it('prevents duplicate submit attempts while creation is in flight', async () => {
    mockGetCurrentWallet.mockReturnValue({
      account: '0xabc123',
      type: 'metamask',
      connected: true,
    });

    let resolveSignature;
    mockSignMessage.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSignature = resolve;
        }),
    );
    mockCreateNFT.mockResolvedValue({
      id: 'nft_2',
      name: 'Weather NFT',
      creation_tx: '0xminttx2',
    });

    render(<CreateNft />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Weather NFT' },
    });

    const createButton = screen.getByRole('button', { name: /Create NFT/i });
    fireEvent.click(createButton);
    fireEvent.click(createButton);

    expect(mockSignMessage).toHaveBeenCalledTimes(1);

    resolveSignature('0xsignedpayload');

    await waitFor(() => {
      expect(mockCreateNFT).toHaveBeenCalledTimes(1);
    });
  });

  it('fails closed when connected wallet changes after signing', async () => {
    let currentWallet = {
      account: '0xabc123',
      type: 'metamask',
      connected: true,
    };
    mockGetCurrentWallet.mockImplementation(() => currentWallet);
    mockSignMessage.mockImplementation(async () => {
      currentWallet = {
        account: '0xdef456',
        type: 'metamask',
        connected: true,
      };
      return '0xsignedpayload';
    });

    render(<CreateNft />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Weather NFT' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create NFT/i }));

    await waitFor(() => {
      expect(screen.getByText(/NFT Creation Failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Connected wallet changed during signing. Reconnect and try again./i,
        ),
      ).toBeInTheDocument();
    });

    expect(mockCreateNFT).not.toHaveBeenCalled();
  });

  it('still signs with the first-party ed25519 wallet, under the NFT-create purpose tag', async () => {
    const vectorAddress = '0x3f995ceb27e8177077dbed8b1e4f696af74da492';
    const provider = new CustomWalletProvider();
    await provider.connect({
      address: vectorAddress,
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    });
    mockGetCurrentWallet.mockReturnValue({ account: vectorAddress, type: 'custom', connected: true });
    mockSignMessage.mockImplementation(message => provider.signNftCreate(message));
    mockCreateNFT.mockResolvedValue({ id: 'nft_2', name: 'Weather NFT', creation_tx: '0xminttx2' });

    render(<CreateNft />);
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Weather NFT' } });
    fireEvent.click(screen.getByRole('button', { name: /Create NFT/i }));

    await waitFor(() => {
      expect(mockCreateNFT).toHaveBeenCalledTimes(1);
    });
    const { signature, signingPayload } = mockCreateNFT.mock.calls[0][0];
    expect(signature).toMatch(/^[0-9a-f]{128}$/);
    const sig = Uint8Array.from(signature.match(/.{2}/g), b => Number.parseInt(b, 16));
    const enc = new TextEncoder();
    // Valid over the NFT-create envelope only: not the raw payload, not the generic-message envelope.
    const pub = provider.signingAccount.publicKey;
    expect(ed25519.verify(sig, enc.encode(`wrfcoin_nft_create_v1\n${signingPayload}`), pub)).toBe(true);
    expect(ed25519.verify(sig, enc.encode(`wrfcoin_generic_message_v1\n${signingPayload}`), pub)).toBe(false);
    expect(ed25519.verify(sig, enc.encode(signingPayload), provider.signingAccount.publicKey)).toBe(false);
    await waitFor(() => {
      expect(screen.getByText(/NFT Created Successfully/i)).toBeInTheDocument();
    });
  });
});
