/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';

// ---------------------------------------------------------------------------
// Mocks — must be set up before dynamically importing the component
// ---------------------------------------------------------------------------

const mockWalletContext = {
  isConnected: false,
  isConnecting: false,
  account: null as string | null,
  chainId: null as string | number | null,
  balance: '0',
  formattedBalance: '0 WRF',
  shortAccount: null,
  activeProvider: null,
  error: null,
  isLoadingBalance: false,
  isLoadingTransaction: false,
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  refreshBalance: jest.fn(),
  openWalletSelector: jest.fn(),
  closeWalletSelector: jest.fn(),
  showWalletSelector: false,
  sendTransaction: jest.fn(),
  signMessage: jest.fn(),
  switchChain: jest.fn(),
  availableProviders: [],
  isWalletConnected: false,
  currentAccount: null,
};

await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({
  useWallet: () => mockWalletContext,
}));

const mockGenerateNewMnemonic = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue('word '.repeat(12).trim());
const mockCreateWalletFromMnemonic = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
  address: '0x' + 'a'.repeat(40),
  sessionId: 'test',
});
const mockImportWalletFromMnemonic = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
  address: '0x' + 'b'.repeat(40),
  sessionId: 'test',
});
const mockImportWalletFromPrivateKey = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
  address: '0x' + 'c'.repeat(40),
  sessionId: 'test',
});
const mockValidateMnemonicPhrase = jest.fn().mockReturnValue(true);

await jest.unstable_mockModule('../../utils/walletUtils.ts', () => ({
  walletManager: {
    generateNewMnemonic: (...args: unknown[]) => mockGenerateNewMnemonic(...args),
    createWalletFromMnemonic: (...args: unknown[]) => mockCreateWalletFromMnemonic(...args),
    importWalletFromMnemonic: (...args: unknown[]) => mockImportWalletFromMnemonic(...args),
    importWalletFromPrivateKey: (...args: unknown[]) => mockImportWalletFromPrivateKey(...args),
    validateMnemonicPhrase: (...args: unknown[]) => mockValidateMnemonicPhrase(...args),
  },
}));

const mockNavigate = jest.fn();
await jest.unstable_mockModule('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

await jest.unstable_mockModule('../../components/wallet/v2/HardwareWalletSection.jsx', () => ({
  default: function MockHardwareWalletSection({ onWalletConnected }: { onWalletConnected?: () => void }) {
    return React.createElement('div', { 'data-testid': 'hardware-wallet-mock' }, 'Hardware Wallet Mock');
  },
}));

// Stub @mui/material barrel to prevent 1200+ VM modules from loading in ESM mode.
// These passthrough stubs preserve rendered text so assertions on content still pass.
await jest.unstable_mockModule('@mui/material', () => ({
  Stepper: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'stepper' }, children),
  Step: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'step' }, children),
  StepLabel: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { className: 'step-label' }, children),
  Box: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
  Typography: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('span', null, children),
  CircularProgress: () =>
    React.createElement('span', { 'data-testid': 'loading-spinner' }),
  Collapse: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
}));

await jest.unstable_mockModule('../../components/DesignSystem', () => ({
  WrfButton: ({
    children,
    onClick,
    disabled,
    loading,
    type,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    type?: string;
  }) =>
    React.createElement('button', { onClick, disabled: disabled || loading, type }, children),
  WrfCard: ({ children, headerTitle }: { children?: React.ReactNode; headerTitle?: string }) =>
    React.createElement('div', null, headerTitle && React.createElement('div', null, headerTitle), children),
  WrfAlert: ({
    children,
    title,
    severity,
  }: {
    children?: React.ReactNode;
    title?: string;
    severity?: string;
  }) =>
    React.createElement(
      'div',
      { role: 'alert', 'data-severity': severity },
      title && React.createElement('strong', null, title),
      children,
    ),
  WrfInput: ({
    value,
    onChange,
    placeholder,
    label,
    type,
    id,
  }: {
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    label?: string;
    type?: string;
    id?: string;
  }) =>
    React.createElement('input', {
      value,
      onChange,
      placeholder: placeholder ?? label,
      type: type ?? 'text',
      id,
    }),
  WrfThemeProvider: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
}));

await jest.unstable_mockModule('../../components/auth/SocialLoginButton', () => ({
  SocialLoginButton: ({ label, onClick }: { label?: string; onClick?: () => void }) =>
    React.createElement('button', { onClick }, label ?? 'Social Login'),
  default: ({ label, onClick }: { label?: string; onClick?: () => void }) =>
    React.createElement('button', { onClick }, label ?? 'Social Login'),
}));

global.fetch = jest.fn() as typeof global.fetch;

const { default: OnboardingPage, FAUCET_TERMS } = await import('../OnboardingPage');
const { default: FEATURES } = await import('../../config/features');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const theme = createTheme();

const renderPage = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <OnboardingPage />
      </ThemeProvider>
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OnboardingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockWalletContext.isConnected = false;
    mockWalletContext.isConnecting = false;
    mockWalletContext.account = null;
    mockWalletContext.chainId = null;
    (global.fetch as ReturnType<typeof jest.fn>).mockReset();
  });

  it('renders stepper with 4 step labels', () => {
    renderPage();

    expect(screen.getByText('Wallet Setup')).toBeInTheDocument();
    expect(screen.getByText('Fund Wallet')).toBeInTheDocument();
    expect(screen.getByText('Hardware Wallet')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('starts on wallet setup step showing "Create New Wallet"', () => {
    renderPage();

    expect(screen.getByText('Create New Wallet')).toBeInTheDocument();
  });

  it('shows the faucet terms before any wallet is created', () => {
    renderPage();
    const terms = screen.getByTestId('onboarding-faucet-terms');
    expect(terms).toHaveTextContent('10 test WRF per claim');
    expect(terms).toHaveTextContent('One claim per address every 24 hours.');
    expect(terms).toHaveTextContent('Test coins have no value');
    expect(FAUCET_TERMS).toHaveLength(3);
    // Faucet not open in this build: say so, but still let the newcomer make a wallet.
    expect(terms).toHaveTextContent('The faucet is not paying out yet');
    // The terms render ahead of the wallet-creation choice in document order.
    const create = screen.getByText('Create New Wallet');
    expect(terms.compareDocumentPosition(create) & terms.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(mockCreateWalletFromMnemonic).not.toHaveBeenCalled();
  });

  it('offers the passkey wallet as the alternative only when the build serves /wallet/passkey', () => {
    const previous = FEATURES.passkeyWallet;
    try {
      (FEATURES as { passkeyWallet: boolean }).passkeyWallet = false;
      const { unmount } = renderPage();
      expect(screen.queryByTestId('onboarding-passkey-option')).toBeNull();
      unmount();

      (FEATURES as { passkeyWallet: boolean }).passkeyWallet = true;
      renderPage();
      const option = screen.getByTestId('onboarding-passkey-option');
      expect(option).toHaveTextContent('no 12 words to write down');
      expect(option).toHaveTextContent('YubiKey');
      expect(option).toHaveTextContent('Get test coins');
      fireEvent.click(screen.getByRole('button', { name: 'Use a passkey wallet instead' }));
      expect(mockNavigate).toHaveBeenCalledWith('/wallet/passkey');
    } finally {
      (FEATURES as { passkeyWallet: boolean }).passkeyWallet = previous;
    }
  });

  it('does NOT offer to import an existing wallet secret (security 2026-08-17)', () => {
    renderPage();

    // The "Import Existing Wallet" card (paste a recovery phrase / private key)
    // was removed. The safe options — create-new and connect-browser-wallet —
    // remain. (MUI Collapse renders its children into the DOM even while
    // collapsed, so a queryByText miss here means the card is truly gone, not
    // merely hidden.)
    expect(screen.queryByText('Import Existing Wallet')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Restore a wallet using your mnemonic phrase or private key/i),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Connect Browser Wallet').length).toBeGreaterThan(0);
  });

  it('shows skip button on hardware wallet step', () => {
    localStorage.setItem(
      'wrfcoin_onboarding',
      JSON.stringify({
        currentStep: 2,
        completedSteps: {
          '0': { walletAddress: '0x' + 'a'.repeat(40) },
          '1': {},
        },
        walletAddress: '0x' + 'a'.repeat(40),
      }),
    );

    renderPage();

    expect(screen.getByText('Skip This Step')).toBeInTheDocument();
  });

  it('shows completion screen on step 3', () => {
    localStorage.setItem(
      'wrfcoin_onboarding',
      JSON.stringify({
        currentStep: 3,
        completedSteps: {
          '0': { walletAddress: '0x' + 'a'.repeat(40) },
          '1': { txHash: '0x' + 'f'.repeat(64) },
          '2': { skipped: true },
        },
        walletAddress: '0x' + 'a'.repeat(40),
      }),
    );

    renderPage();

    expect(screen.getByText('You\'re All Set!')).toBeInTheDocument();
  });

  it('displays faucet error message on 429 response (faucet open)', async () => {
    // The claim flow exists only once the build says the faucet is funded.
    const previousEnv = (globalThis as any).__VITE_ENV__;
    (globalThis as any).__VITE_ENV__ = { ...(previousEnv ?? {}), VITE_FAUCET_OPEN: 'true' };
    try {
      localStorage.setItem(
        'wrfcoin_onboarding',
        JSON.stringify({
          currentStep: 1,
          completedSteps: {
            '0': { walletAddress: '0x' + 'a'.repeat(40) },
          },
          walletAddress: '0x' + 'a'.repeat(40),
        }),
      );

      const fetchMock = global.fetch as ReturnType<typeof jest.fn>;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challengeId: 'challenge-123',
          question: 'What is 2 + 2?',
        }),
      } as Response);

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          message: 'Rate limit exceeded. Try again later.',
        }),
      } as Response);

      renderPage();

      expect(
        screen.getByText(
          'Experimental testnet only — WRF coins are valueless and have no monetary value.',
        ),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      const answerInput = screen.getByPlaceholderText('Enter the answer');
      fireEvent.change(answerInput, { target: { value: '4' } });

      const claimButton = screen.getByText('Claim Tokens');
      fireEvent.click(claimButton);

      await waitFor(() => {
        expect(
          screen.getByText('Rate limit exceeded. Try again later.'),
        ).toBeInTheDocument();
      });
    } finally {
      (globalThis as any).__VITE_ENV__ = previousEnv;
    }
  });

  it('faucet off by default: an honest unfunded notice, no challenge request, no claim', async () => {
    localStorage.setItem(
      'wrfcoin_onboarding',
      JSON.stringify({
        currentStep: 1,
        completedSteps: { '0': { walletAddress: '0x' + 'a'.repeat(40) } },
        walletAddress: '0x' + 'a'.repeat(40),
      }),
    );
    renderPage();
    expect(screen.getByText('The faucet is not funded yet')).toBeInTheDocument();
    expect(screen.getByText(/An opening block is not yet available/)).toBeInTheDocument();
    expect(screen.queryByText('Claim Tokens')).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Continue without test tokens'));
    const saved = JSON.parse(localStorage.getItem('wrfcoin_onboarding') ?? '{}');
    expect(saved.completedSteps['1']).toEqual({ faucetUnavailable: true });
  });

  it('shows browser compatibility warning when WebUSB is unavailable', () => {
    const usbDescriptor = Object.getOwnPropertyDescriptor(navigator, 'usb');
    if (usbDescriptor) {
      Object.defineProperty(navigator, 'usb', {
        value: undefined,
        configurable: true,
      });
    }

    localStorage.setItem(
      'wrfcoin_onboarding',
      JSON.stringify({
        currentStep: 2,
        completedSteps: {
          '0': { walletAddress: '0x' + 'a'.repeat(40) },
          '1': {},
        },
        walletAddress: '0x' + 'a'.repeat(40),
      }),
    );

    renderPage();

    expect(screen.getByText(/Chrome or Edge/i)).toBeInTheDocument();

    if (usbDescriptor) {
      Object.defineProperty(navigator, 'usb', usbDescriptor);
    }
  });
});
