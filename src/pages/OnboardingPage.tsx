import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Stepper, Step, StepLabel, Box, Typography, CircularProgress, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { WrfButton, WrfCard, WrfAlert, WrfInput } from '../components/DesignSystem';
import { useOnboardingState } from '../hooks/useOnboardingState';
import { FAUCET_DISCLAIMER } from '../services/apiClient';
// @ts-ignore - SocialLoginButton is a .jsx file
import { SocialLoginButton } from '../components/auth/SocialLoginButton';
import FEATURES from '../config/features';
import { WRFCOIN_CHAIN_ID } from '../config/network';
import WebWalletSetup from '../components/wallet/WebWalletSetup';

// @ts-ignore - WalletContext is a .jsx file
import { useWallet } from '../contexts/WalletContext.jsx';
import { readVault, vaultSupported, VAULT_UNSUPPORTED_MESSAGE } from '../services/walletVault.ts';

interface WalletContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | string | null;
  openWalletSelector: () => void;
  [key: string]: unknown;
}

const HardwareWalletIntegration = lazy(
  () => import('../components/wallet/v2/HardwareWalletSection.jsx'),
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The address of the wallet this browser holds encrypted (frontend#438), or null. */
function readSavedVaultAddress(): string | null {
  return readVault()?.address ?? null;
}

/**
 * The public build (W18, owner ruling 2026-10-01): the onboarding loop is open
 * there, but social sign-in (its derived address is unverified), browser
 * wallets (EVM wallets cannot sign for the WRFCoin chain) and links to hidden
 * routes are not. Read at render time so tests can switch builds.
 */
function isPublicBuild(): boolean {
  return Boolean(FEATURES.publicReadonly) && !FEATURES.fullStudio;
}

/**
 * The faucet pays nothing until an operator funds it (testnet: around block
 * 33000). Until the build says it is open, the step says so plainly instead of
 * offering a claim that cannot succeed. Only the exact string `true` opens it.
 */
function isFaucetOpen(): boolean {
  return import.meta.env?.VITE_FAUCET_OPEN === 'true';
}

// ---------------------------------------------------------------------------
// Internal sub-components (kept in-file per task spec)
// ---------------------------------------------------------------------------

/**
 * Mnemonic word grid - displays generated mnemonic as numbered word chips.
 */
function MnemonicGrid({ mnemonic }: { mnemonic: string }) {
  const words = mnemonic.split(' ');
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
        my: 2,
      }}
    >
      {words.map((word, i) => (
        <Box
          key={i}
          sx={{
            py: 1,
            px: 1.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            textAlign: 'center',
            fontSize: '0.8125rem',
            fontFamily: 'monospace',
          }}
        >
          {i + 1}. {word}
        </Box>
      ))}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Step 0: Wallet Setup
// ---------------------------------------------------------------------------

// Importing an EXISTING recovery phrase or private key by pasting it into the
// page was removed (security audit 2026-08-17): no legitimate site should train
// users to type a reusable wallet secret into a web form. Supported paths are
// social login (no seed), generating a fresh in-browser wallet, and connecting
// an external browser wallet that signs without ever exposing its key.
type WalletSetupMode = 'select' | 'create' | 'social';

interface WalletSetupStepProps {
  completeStep: (step: number, data: Record<string, unknown>) => void;
}

function WalletSetupStep({ completeStep }: WalletSetupStepProps) {
  const { connectWallet } = useWallet();
  const [mode, setMode] = useState<WalletSetupMode>('social');

  // --- Unlock the wallet this browser already holds (frontend#438 review P1) ---
  const [savedAddress, setSavedAddress] = useState<string | null>(() => readSavedVaultAddress());
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- Create wallet state ---
  const [walletName, setWalletName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleGenerateMnemonic = useCallback(async () => {
    try {
      const { walletManager } = await import('../utils/walletUtils.ts');
      const phrase = await walletManager.generateNewMnemonic(128);
      setMnemonic(phrase);
    } catch (err) {
      setCreateError('Failed to generate mnemonic. Please try again.');
    }
  }, []);

  const handleCreateWallet = useCallback(async () => {
    setCreateError('');

    if (!walletName.trim()) {
      setCreateError('Wallet name is required.');
      return;
    }
    if (password.length < 8) {
      setCreateError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setCreateError('Passwords do not match.');
      return;
    }
    if (!mnemonic) {
      setCreateError('Please generate a mnemonic first.');
      return;
    }
    if (!termsAccepted) {
      setCreateError('You must agree to the terms.');
      return;
    }
    // frontend#438 review: without WebCrypto (an http page, not a secure context) the words cannot be
    // encrypted. Say so plainly instead of a retry message; nothing is stored in clear.
    if (!vaultSupported()) {
      setCreateError(VAULT_UNSUPPORTED_MESSAGE);
      return;
    }

    setCreating(true);
    try {
      // frontend#438: the 12 words alone are the wallet (empty BIP-39 passphrase, the shared cross-wallet
      // scheme). The password only encrypts this browser's copy of the words; it never enters the key.
      const { walletManager } = await import('../utils/walletUtils.ts');
      const info = await walletManager.createWalletFromMnemonic(mnemonic);
      const walletAddress = info.address;
      const { saveVault } = await import('../services/walletVault.ts');
      await saveVault(mnemonic, walletAddress, password);
      setSavedAddress(walletAddress);
      // The created wallet becomes the connected AND signed-in account (frontend#438 review P2):
      // connectWallet runs the ed25519 login and disconnects again if it fails.
      try {
        await connectWallet('custom', { walletData: info });
      } catch {
        setCreateError('Your wallet is saved in this browser, but signing in failed. Go back and unlock it to try again.');
        return;
      }

      console.info('[onboarding]', 'onboarding_wallet_created');
      completeStep(0, { walletAddress });
    } catch (err) {
      setCreateError('Failed to create wallet. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [walletName, password, confirmPassword, mnemonic, termsAccepted, completeStep, connectWallet]);

  const handleUnlock = useCallback(async () => {
    setUnlockError('');
    setUnlocking(true);
    try {
      const { unlockVault } = await import('../services/walletVault.ts');
      let words: { mnemonic: string; address: string };
      try {
        words = await unlockVault(unlockPassword);
      } catch {
        setUnlockError('Wrong password.');
        return;
      }
      // The words must still derive the address the vault was saved for; a copy that does not is never used.
      const { walletManager } = await import('../utils/walletUtils.ts');
      const info = await walletManager.createWalletFromMnemonic(words.mnemonic);
      words.mnemonic = '';
      if (info.address.toLowerCase() !== words.address.toLowerCase()) {
        setUnlockError('The copy in this browser does not match its address. Restore from your written words in the app.');
        return;
      }
      try {
        await connectWallet('custom', { walletData: info });
      } catch {
        setUnlockError('Signing in failed. Please try again.');
        return;
      }
      setUnlockPassword('');
      completeStep(0, { walletAddress: info.address });
    } finally {
      setUnlocking(false);
    }
  }, [unlockPassword, connectWallet, completeStep]);

  const unlockCard = savedAddress ? (
    <WrfCard variant="outlined" headerTitle="Unlock the wallet saved in this browser">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }} data-testid="onboarding-unlock-saved-wallet">
        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {savedAddress}
        </Typography>
        <WrfInput
          label="Password for this browser's copy"
          type="password"
          value={unlockPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnlockPassword(e.target.value)}
        />
        {unlockError && <WrfAlert severity="error">{unlockError}</WrfAlert>}
        <WrfButton variant="primary" onClick={handleUnlock} loading={unlocking} disabled={!unlockPassword}>
          Unlock
        </WrfButton>
      </Box>
    </WrfCard>
  ) : null;

  // --- Public build: no keys on the web (lead decision 2026-10-01; web key
  // custody is an owner question, frontend#437/#438). The wallet lives in the
  // phone app; this page never creates, imports or asks for a secret. ---
  if ((mode === 'social' || mode === 'select') && isPublicBuild()) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} data-testid="onboarding-public-wallet-setup">
        <Typography variant="h6" component="h2">Your wallet lives in the WRFCoin app</Typography>
        <Typography variant="body2" color="text.secondary">
          Create or restore your WRFCoin wallet in the WRFCoin phone app. The testnet is
          invite-only for now, and your invitation includes the app.
        </Typography>
        <WrfAlert severity="info">
          This site never creates a wallet and never asks for your recovery phrase. If a page
          asks you to type it in, do not.
        </WrfAlert>
        <WrfButton variant="primary" onClick={() => completeStep(0, { walletInApp: true })}>
          I have the app
        </WrfButton>
      </Box>
    );
  }

  // --- Social Mode (Default) ---
  if (mode === 'social' || mode === 'select') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {unlockCard}
        <Typography variant="h6" component="h2">No wallet? No problem.</Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in with your existing social account. A smart wallet is created instantly for you — no seed phrases needed.
        </Typography>
        <SocialLoginButton
          provider="google"
          onSuccess={(addr: string) => {
            localStorage.setItem(
              'wrfcoin_wallet',
              JSON.stringify({ address: addr, type: 'social-google', created: new Date().toISOString() }),
            );
            completeStep(0, { walletAddress: addr });
          }}
        />
        <SocialLoginButton
          provider="apple"
          onSuccess={(addr: string) => {
            localStorage.setItem(
              'wrfcoin_wallet',
              JSON.stringify({ address: addr, type: 'social-apple', created: new Date().toISOString() }),
            );
            completeStep(0, { walletAddress: addr });
          }}
        />

        <Box sx={{ mt: 2 }}>
          <WrfButton
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
            fullWidth
            sx={{ justifyContent: 'space-between' }}
          >
              Advanced / Developer Options
          </WrfButton>
          
          <Collapse in={showAdvanced}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                   <WrfCard
                variant="outlined"
                headerTitle="Create New Wallet"
                sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
                onClick={() => setMode('create')}
              >
                    <Typography variant="body2" color="text.secondary">
                      Generate a brand-new wallet with a secure mnemonic phrase.
                    </Typography>
                  </WrfCard>

                  <WrfCard variant="outlined" headerTitle="Connect Browser Wallet">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Connect MetaMask or another browser wallet.
                    </Typography>
                    <WalletConnectWrapper completeStep={completeStep} />
                  </WrfCard>
              </Box>
          </Collapse>
        </Box>
      </Box>
    );
  }

  // --- Create Mode ---
  if (mode === 'create') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <WrfButton variant="ghost" onClick={() => setMode('social')} sx={{ alignSelf: 'flex-start' }}>
          Back
        </WrfButton>
        <Typography variant="h6" component="h2">Create New Wallet</Typography>

        {createError && (
          <WrfAlert severity="error">{createError}</WrfAlert>
        )}

        <WrfInput
          label="Wallet Name"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          placeholder="My WRFCoin Wallet"
        />
        <WrfInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
        <WrfInput
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
        />
        <Typography variant="body2" color="text.secondary" data-testid="create-password-scope">
          This password only locks this browser&apos;s copy of your wallet. It is not part of your recovery
          phrase: the 12 words alone restore your wallet anywhere.
        </Typography>

        {!mnemonic ? (
          <WrfButton variant="secondary" onClick={handleGenerateMnemonic}>
            Generate Mnemonic
          </WrfButton>
        ) : (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Your Recovery Phrase
            </Typography>
            <MnemonicGrid mnemonic={mnemonic} />
            <WrfAlert severity="warning">
              Write down this phrase and store it safely. This is the only way to recover your wallet.
            </WrfAlert>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <input
            type="checkbox"
            id="create-terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <label htmlFor="create-terms" style={{ fontSize: '0.875rem' }}>
            I agree to the Terms of Service and Privacy Policy
          </label>
        </Box>

        <WrfButton
          variant="primary"
          onClick={handleCreateWallet}
          loading={creating}
          disabled={creating || !mnemonic}
        >
          Create Wallet
        </WrfButton>
      </Box>
    );
  }

  // Pasting an existing recovery phrase / private key was removed (security
  // audit 2026-08-17). `mode` is now only 'social' | 'select' | 'create',
  // all handled above; this return is unreachable and exists for exhaustiveness.
  return null;
}

/**
 * Wrapper around the existing WalletConnectButton that auto-advances on connect.
 */
function WalletConnectWrapper({
  completeStep,
}: {
  completeStep: (step: number, data: Record<string, unknown>) => void;
}) {
  // We import the component dynamically to avoid pulling in the full JSX
  // module at top-level. However since it's a small component, we can just
  // inline the button usage via the context.
  const { isConnected, account, openWalletSelector, isConnecting } = useWallet();

  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    if (isConnected && account && !advanced) {
      setAdvanced(true);
      console.info('[onboarding]', 'onboarding_wallet_connected');
      completeStep(0, { walletAddress: account });
    }
  }, [isConnected, account, advanced, completeStep]);

  return (
    <WrfButton
      variant="outline"
      onClick={openWalletSelector}
      loading={isConnecting}
      disabled={isConnecting}
    >
      {isConnecting ? 'Connecting...' : 'Connect Browser Wallet'}
    </WrfButton>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Fund Wallet
// ---------------------------------------------------------------------------

interface FundWalletStepProps {
  walletAddress: string | null;
  completeStep: (step: number, data: Record<string, unknown>) => void;
}

function FundWalletStep({ walletAddress, completeStep }: FundWalletStepProps) {
  const [challengeId, setChallengeId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingChallenge, setFetchingChallenge] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ txHash: string; amount: string } | null>(null);

  const fetchChallenge = useCallback(async () => {
    setFetchingChallenge(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding/faucet/challenge', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to fetch challenge');
      const data = await res.json();
      setChallengeId(data.challengeId);
      setQuestion(data.question);
    } catch {
      setError('Failed to load challenge. Please try again.');
    } finally {
      setFetchingChallenge(false);
    }
  }, []);

  const faucetOpen = isFaucetOpen();

  // Fetch challenge on mount (only when there is a faucet to claim from)
  useEffect(() => {
    if (faucetOpen) fetchChallenge();
  }, [faucetOpen, fetchChallenge]);

  const handleClaim = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding/faucet/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, challengeId, answer }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle 429 and other errors
        const message =
          data?.error?.message || data?.message || 'Failed to claim tokens';
        setError(message);
        return;
      }

      setSuccess({ txHash: data.txHash, amount: data.amount });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, challengeId, answer]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" component="h2">Fund Your Wallet</Typography>
      <WrfAlert severity="warning" title="Testnet faucet">
        {FAUCET_DISCLAIMER}
      </WrfAlert>

      {/* Wallet address display (none in the public build: the wallet is in the app) */}
      {(walletAddress || !isPublicBuild()) && (
        <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Your Wallet Address
        </Typography>
        <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              fontFamily: 'monospace',
              fontSize: '0.8125rem',
              wordBreak: 'break-all',
            }}
          >
          {walletAddress || 'No wallet address'}
        </Box>
      </Box>
      )}

      {error && <WrfAlert severity="error">{error}</WrfAlert>}

      {!faucetOpen ? (
        <Box data-testid="faucet-unfunded" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <WrfAlert severity="info" title="The faucet is not funded yet">
            The testnet faucet has no WRF to give out yet. An opening block is not yet available. You can finish setting up now; your wallet works
            without test tokens.
          </WrfAlert>
          <WrfButton
            variant="primary"
            onClick={() => completeStep(1, { faucetUnavailable: true })}
          >
            Continue without test tokens
          </WrfButton>
        </Box>
      ) : success ? (
        <>
          <WrfAlert severity="success" title="Tokens Claimed!">
            <Typography variant="body2">
              Transaction: <code>{success.txHash.slice(0, 18)}...</code>
            </Typography>
            <Typography variant="body2">Amount: {success.amount} WRF</Typography>
          </WrfAlert>
          <WrfButton
            variant="primary"
            onClick={() => {
              console.info('[onboarding]', 'onboarding_faucet_claimed');
              completeStep(1, { txHash: success.txHash });
            }}
          >
            Continue
          </WrfButton>
        </>
      ) : (
        <>
          {fetchingChallenge ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : question ? (
            <>
              <WrfAlert severity="info" title="Verification Challenge">
                {question}
              </WrfAlert>
              <WrfInput
                label="Your Answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter the answer"
              />
              <WrfButton
                variant="primary"
                onClick={handleClaim}
                loading={loading}
                disabled={loading || !answer.trim()}
              >
                Claim Tokens
              </WrfButton>
            </>
          ) : (
            <WrfButton variant="outline" onClick={fetchChallenge}>
              Retry Loading Challenge
            </WrfButton>
          )}
        </>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Hardware Wallet (Optional)
// ---------------------------------------------------------------------------

interface HardwareWalletStepProps {
  completeStep: (step: number, data: Record<string, unknown>) => void;
  skipStep: (step: number) => void;
}

function HardwareWalletStep({ completeStep, skipStep }: HardwareWalletStepProps) {
  const supportsWebUSB = typeof navigator !== 'undefined' && 'usb' in navigator;

  const handleSkip = useCallback(() => {
    console.info('[onboarding]', 'onboarding_hardware_skipped');
    skipStep(2);
  }, [skipStep]);

  const handleConnected = useCallback(() => {
    console.info('[onboarding]', 'onboarding_hardware_connected');
    completeStep(2, { hardwareConnected: true });
  }, [completeStep]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">Hardware Wallet (Optional)</Typography>
        <WrfButton variant="outline" onClick={handleSkip}>
          Skip This Step
        </WrfButton>
      </Box>

      {isPublicBuild() ? (
        <WrfAlert severity="info" data-testid="hardware-unsupported">
          Hardware wallets are not supported on the WRFCoin testnet yet. You can skip this step.
        </WrfAlert>
      ) : !supportsWebUSB ? (
        <WrfAlert severity="info">
          Hardware wallet connection requires Chrome or Edge. You can skip this step.
        </WrfAlert>
      ) : (
        <Suspense
          fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          }
        >
          <HardwareWalletIntegration />
        </Suspense>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Complete
// ---------------------------------------------------------------------------

interface CompleteStepProps {
  completedSteps: Record<number, Record<string, unknown>>;
  completeStep: (step: number, data: Record<string, unknown>) => void;
}

function CompleteStep({ completedSteps, completeStep }: CompleteStepProps) {
  const navigate = useNavigate();

  // Mark onboarding complete on mount
  useEffect(() => {
    console.info('[onboarding]', 'onboarding_completed');
    completeStep(3, {});
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build summary
  const walletMethod = (() => {
    const step0 = completedSteps[0];
    if (!step0) return 'Unknown';
    if (step0.walletInApp) return 'In the WRFCoin app';
    if (step0.walletAddress && typeof step0.walletAddress === 'string') {
      // Try to determine from localStorage
      try {
        const stored = localStorage.getItem('wrfcoin_wallet');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.type === 'created') return 'Created';
          if (parsed.type?.startsWith('imported')) return 'Imported';
        }
      } catch {
        // ignore
      }
      return 'Connected';
    }
    return 'Unknown';
  })();

  const tokensClaimed = !!completedSteps[1]?.txHash;
  const faucetUnavailable = !!completedSteps[1]?.faucetUnavailable;
  const hardwareSkipped = !!completedSteps[2]?.skipped;
  const hardwareConnected = !!completedSteps[2]?.hardwareConnected;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'center' }}>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
        You're All Set!
      </Typography>

      <WrfCard variant="filled">
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Setup Summary
        </Typography>
        <Box component="ul" sx={{ textAlign: 'left', m: 0, pl: 3 }}>
          <li>
            <Typography variant="body2">
              Wallet: {walletMethod}
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Tokens: {tokensClaimed ? 'Claimed' : faucetUnavailable ? 'Faucet not funded yet' : 'Skipped'}
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Hardware Wallet:{' '}
              {hardwareConnected ? 'Connected' : hardwareSkipped ? 'Skipped' : 'Not configured'}
            </Typography>
          </li>
        </Box>
      </WrfCard>

      <Typography variant="h6" component="h3" sx={{ mt: 1 }}>
        What would you like to do next?
      </Typography>

      {isPublicBuild() ? (
        <Box
          data-testid="onboarding-public-next-steps"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <WrfCard variant="outlined">
            <Typography variant="subtitle2" gutterBottom>
              Explore the network
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Browse blocks and stations.
            </Typography>
            <WrfButton variant="primary" onClick={() => navigate('/explore')} fullWidth>
              Explore
            </WrfButton>
          </WrfCard>
          <WrfCard variant="outlined">
            <Typography variant="subtitle2" gutterBottom>
              Station map
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              See where stations report from, at 0.1 degree.
            </Typography>
            <WrfButton variant="outline" onClick={() => navigate('/map')} fullWidth>
              Open the map
            </WrfButton>
          </WrfCard>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
        <WrfCard variant="outlined">
          <Typography variant="subtitle2" gutterBottom>
            Explore Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            View your portfolio, weather data, and network activity.
          </Typography>
          <WrfButton variant="primary" onClick={() => navigate('/')} fullWidth>
            Explore Dashboard
          </WrfButton>
        </WrfCard>

        <WrfCard variant="outlined">
          <Typography variant="subtitle2" gutterBottom>
            Connect Weather Sensor
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Start earning rewards by contributing weather data.
          </Typography>
          <WrfButton variant="outline" onClick={() => navigate('/weather/onboarding')} fullWidth>
            Connect Weather Sensor
          </WrfButton>
        </WrfCard>

        <WrfCard variant="outlined">
          <Typography variant="subtitle2" gutterBottom>
            Browse Marketplace
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Explore computational NFTs and weather data assets.
          </Typography>
          <WrfButton variant="outline" onClick={() => navigate('/nft/marketplace')} fullWidth>
            Browse Marketplace
          </WrfButton>
        </WrfCard>
      </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main OnboardingPage component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const {
    currentStep,
    completedSteps,
    walletAddress,
    steps,
    completeStep,
    skipStep,
    reset,
  } = useOnboardingState();

  const { isConnected, account, chainId } = useWallet();
  const [webWalletReady, setWebWalletReady] = useState(false);

  // --- Auto-advance: if wallet already connected on mount, skip step 0 ---
  const [autoAdvanced, setAutoAdvanced] = useState(false);

  useEffect(() => {
    if (!isPublicBuild() && isConnected && account && currentStep === 0 && !autoAdvanced && !completedSteps[0]) {
      setAutoAdvanced(true);
      console.info('[onboarding]', 'onboarding_started');
      console.info('[onboarding]', 'onboarding_wallet_connected');
      completeStep(0, { walletAddress: account });
    }
  }, [isConnected, account, currentStep, autoAdvanced, completedSteps, completeStep]);

  // Log onboarding_started on first render of step 0
  useEffect(() => {
    if (currentStep === 0 && !completedSteps[0]) {
      console.info('[onboarding]', 'onboarding_started');
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Network mismatch guardrail ---
  // Compared with the build's chain id (777 on testnet); no configured id, no
  // warning, rather than a guess.
  const showNetworkWarning =
    isConnected &&
    chainId != null &&
    WRFCOIN_CHAIN_ID != null &&
    String(chainId) !== WRFCOIN_CHAIN_ID;

  // --- Render step content ---
  function renderStepContent() {
    // Saved onboarding progress is not proof that this session owns the key.
    // Stay here until backup/unlock and signed login have both succeeded.
    if (isPublicBuild() && !webWalletReady) {
      return <WebWalletSetup onComplete={address => {
        if (currentStep === 0) completeStep(0, { walletAddress: address });
        else if (walletAddress !== address) {
          reset();
          completeStep(0, { walletAddress: address });
        }
        setWebWalletReady(true);
      }} />;
    }
    switch (currentStep) {
    case 0:
      return <WalletSetupStep completeStep={completeStep} />;
    case 1:
      return <FundWalletStep walletAddress={walletAddress} completeStep={completeStep} />;
    case 2:
      return <HardwareWalletStep completeStep={completeStep} skipStep={skipStep} />;
    case 3:
      return <CompleteStep completedSteps={completedSteps} completeStep={completeStep} />;
    default:
      return null;
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
        Welcome to WRFCoin
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        Let's get your testnet wallet set up. Testnet WRF has no monetary value.
      </Typography>

      {/* Network mismatch warning */}
      {showNetworkWarning && (
        <WrfAlert severity="warning" sx={{ mb: 3 }}>
          You're connected to an unexpected network. Some features may not work correctly.
        </WrfAlert>
      )}

      {/* Stepper */}
      <Stepper activeStep={isPublicBuild() && !webWalletReady ? 0 : currentStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={step.key} completed={!!completedSteps[index]}>
            <StepLabel
              optional={
                'optional' in step && step.optional ? (
                  <Typography variant="caption">Optional</Typography>
                ) : undefined
              }
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step content */}
      <Box sx={{ mt: 2 }}>{renderStepContent()}</Box>
    </Box>
  );
}
