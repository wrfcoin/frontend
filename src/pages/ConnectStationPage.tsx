/**
 * ConnectStationPage — self-service weather-station registration.
 *
 * A four-step wizard that takes a new user from zero to an on-chain,
 * registered weather station:
 *   1. Wallet  — create a new non-custodial first-party wallet (forced seed
 *      backup + verification) and log in with its ed25519 key (frontend#373 /
 *      backend#1208). The JWT sub, and therefore the station owner, is the
 *      wallet's lowercase core4 chain address.
 *   2. Fund    — optionally claim faucet WRF so the wallet can transact.
 *   3. Station — verify Ambient API/app keys and capture station metadata.
 *   4. Confirm — register the station (wallet JWT) and report only that fact.
 *
 * Security notes:
 *   - The mnemonic and private key live ONLY in component state for the
 *     session. We never auto-persist them to localStorage unencrypted.
 *   - We never console.log mnemonics, private keys, signatures, or API keys.
 *   - The Ambient credentials are stored encrypted server-side; the UI says so.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
// No ethers signer: a new station wallet is the canonical first-party
// ed25519/SLIP-0010 account (core4#3234), the same scheme the wallet page uses.
// The mnemonic comes from the shared BIP-39 generator; the key is derived with
// firstPartyKeys.deriveAccount and only ever signs a validated login challenge.
// (Pasting an existing secret was removed — security audit 2026-08-17.)
import { walletManager } from '../utils/walletUtils';
import {
  bytesToHex,
  deriveAccount,
  type FirstPartyAccount,
} from '../services/walletCrypto/firstPartyKeys';
import { ed25519LoginSigner } from '../services/walletCrypto/firstPartyLoginSigner';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material';
import { WrfButton, WrfCard, WrfInput, WrfAlert } from '../components/DesignSystem';
import {
  FAUCET_DISCLAIMER,
  stationRegistrationService,
  type DetectedDevice,
  type StationRewardProgress,
} from '../services/apiClient';
import { STATION_NAME_PUBLIC_NOTICE } from '../config/stationNamePublicNotice';
import { coarsenCoordinate } from '../utils/geo';
import FEATURES from '../config/features';
import { useOwnedFirstPartyAddress } from '../hooks/useOwnedFirstPartyAddress';

/**
 * The public build (W28, owner ruling 2026-10-02 #14): a station joins with the visitor's ONE wallet, the one
 * set up, imported or unlocked at /onboarding. This page never creates a second, unsaved wallet there.
 */
function isPublicBuild(): boolean {
  return Boolean(FEATURES.publicReadonly) && !FEATURES.fullStudio;
}

// Owner ruling 2026-10-01 (W20, frontend#437): a web registration sends the
// station's position at 0.1 degree (~11 km), like the phones. The exact
// position never leaves this browser: every value that enters the form is
// shown and sent rounded, and the service rounds again before sending.
export const STATION_LOCATION_ROUNDING_NOTICE =
  'Your station\'s location is rounded to 0.1° (about 11 km) before it is sent. The exact position never leaves this browser.';
function toRegistrationCoordinate(value: number): string {
  return Number.isFinite(value) ? coarsenCoordinate(value).toFixed(1) : '';
}

const STEPS = ['Wallet', 'Fund', 'Station', 'Confirm'] as const;

// ---------------------------------------------------------------------------
// Shared session wallet shape (never leaves memory)
// ---------------------------------------------------------------------------

interface SessionWallet {
  /**
   * Lowercase core4 chain address (0x + SHA3-256(pubkey)[..20]). This is the
   * ed25519 login's JWT sub, so it is also the backend station owner and the
   * faucet recipient.
   */
  address: string;
  /** 32-byte ed25519 public key, hex. */
  publicKeyHex: string;
  /** First-party ed25519 account; its key signs login challenges only. */
  account: FirstPartyAccount;
  /** 12-word mnemonic, present only for freshly created wallets. */
  mnemonic?: string;
  imported: boolean;
}

/** Create a fresh first-party ed25519 session wallet from a new mnemonic. */
export async function createFirstPartySessionWallet(): Promise<SessionWallet> {
  const phrase = await walletManager.generateNewMnemonic(128);
  if (!phrase) {
    throw new Error('Mnemonic generation failed.');
  }
  const account = deriveAccount(phrase);
  return {
    address: account.address.toLowerCase(),
    publicKeyHex: bytesToHex(account.publicKey),
    account,
    mnemonic: phrase,
    imported: false,
  };
}

// ---------------------------------------------------------------------------
// Step 1 — Wallet
// ---------------------------------------------------------------------------

// 'connect' (paste an existing recovery phrase / private key) was removed —
// security audit 2026-08-17. A station owner sets up a fresh in-browser wallet;
// reusing an existing wallet will return via external browser-wallet signing.
type WalletMode = 'choose' | 'create';

interface WalletStepProps {
  /**
   * Called with the authenticated wallet's lowercase chain address ONLY.
   * The FirstPartyAccount (raw `sign`) and the mnemonic stay in WalletStep's
   * own state and are dropped when it unmounts; they are never handed to the
   * page root, later wizard steps, or any shared context/provider.
   */
  onAuthenticated: (address: string) => void;
}

function MnemonicGrid({ mnemonic }: { mnemonic: string }) {
  const words = mnemonic.split(/\s+/);
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
          key={`${i}-${word}`}
          sx={{
            py: 1,
            px: 1.5,
            bgcolor: 'action.hover',
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

function WalletStep({ onAuthenticated }: WalletStepProps) {
  const [mode, setMode] = useState<WalletMode>('choose');
  const navigate = useNavigate();
  // The visitor's own signed-in first-party wallet. Its login already set the session token that the
  // registration and reward-progress calls use, so it needs no second login here.
  const ownedAddress = useOwnedFirstPartyAddress();
  const publicBuild = isPublicBuild();

  // --- Create state ---
  const [createWallet, setCreateWallet] = useState<SessionWallet | null>(null);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  // Indices of the words the user must re-enter to prove they backed up.
  const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
  const [verifyInputs, setVerifyInputs] = useState<Record<number, string>>({});
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);


  const generateWallet = useCallback(async () => {
    setCreateError('');
    setCreating(true);
    try {
      // Client-side, non-custodial generation: BIP-39 mnemonic, then the
      // first-party ed25519/SLIP-0010 account derived from it.
      const created = await createFirstPartySessionWallet();
      const phrase = created.mnemonic ?? '';
      setCreateWallet(created);
      // Pick three distinct word positions for the backup challenge.
      const total = phrase.split(/\s+/).length;
      const picks = new Set<number>();
      while (picks.size < 3 && picks.size < total) {
        picks.add(Math.floor(Math.random() * total));
      }
      setVerifyIndices(Array.from(picks).sort((a, b) => a - b));
      setVerifyInputs({});
      setBackupConfirmed(false);
    } catch {
      setCreateError('Could not generate a wallet. Please try again.');
    } finally {
      setCreating(false);
    }
  }, []);

  const verificationPassed = useMemo(() => {
    if (!createWallet?.mnemonic) return false;
    const words = createWallet.mnemonic.split(/\s+/);
    return verifyIndices.every(
      (idx) => (verifyInputs[idx] || '').trim().toLowerCase() === words[idx],
    );
  }, [createWallet, verifyIndices, verifyInputs]);

  const finishCreate = useCallback(async () => {
    if (!createWallet) return;
    if (!backupConfirmed) {
      setCreateError('Please confirm you have safely backed up your recovery phrase.');
      return;
    }
    if (!verificationPassed) {
      setCreateError('The verification words do not match your recovery phrase.');
      return;
    }
    setCreateError('');
    setLoggingIn(true);
    try {
      // ed25519 login (frontend#373 / backend#1208): the backend binds the
      // JWT sub to this lowercase chain address, which then becomes the
      // station owner on POST /weather/stations.
      await stationRegistrationService.loginWithEd25519(
        createWallet.address,
        createWallet.publicKeyHex,
        ed25519LoginSigner(createWallet.account),
      );
      onAuthenticated(createWallet.address);
    } catch {
      setCreateError('Wallet login failed. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  }, [createWallet, backupConfirmed, verificationPassed, onAuthenticated]);

  if (mode === 'choose' && (ownedAddress || publicBuild)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} data-testid="connect-station-own-wallet">
        <Typography variant="h6" component="h2">Your wallet</Typography>
        <Typography variant="body2" color="text.secondary">
          Your wallet is the station owner and receives any rewards that are later recorded.
        </Typography>
        {ownedAddress ? (
          <WrfCard variant="outlined" headerTitle="Use your signed-in wallet">
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mb: 1.5 }}>
              {ownedAddress}
            </Typography>
            <WrfButton variant="primary" onClick={() => onAuthenticated(ownedAddress)}>
              Use this wallet
            </WrfButton>
          </WrfCard>
        ) : (
          <WrfAlert severity="info" title="Set up or unlock your wallet first">
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              Create, import or unlock your wallet in wallet setup, then come back here. A station joins with
              the same wallet; this page does not create another one.
            </Typography>
            <WrfButton variant="primary" onClick={() => navigate('/onboarding')}>
              Open wallet setup
            </WrfButton>
          </WrfAlert>
        )}
      </Box>
    );
  }

  if (mode === 'choose') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" component="h2">Set up your wallet</Typography>
        <Typography variant="body2" color="text.secondary">
          Your wallet identifies the station owner and receives any on-chain
          credits that are later recorded. It is non-custodial — only you hold
          the keys.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This wallet is not saved in this app or in your browser. After you
          leave this page, your 12-word recovery phrase is the only way to
          recover it.
        </Typography>
        <WrfCard
          variant="outlined"
          headerTitle="Create a new wallet"
          sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
          onClick={() => setMode('create')}
        >
          <Typography variant="body2" color="text.secondary">
            Generate a brand-new 12-word recovery phrase in your browser.
          </Typography>
        </WrfCard>
        <Typography variant="caption" color="text.secondary">
          Already have a wallet? Signing in with an external browser wallet
          (e.g. MetaMask) is coming soon. For your safety, this site will never
          ask you to paste an existing recovery phrase or private key.
        </Typography>
      </Box>
    );
  }

  if (mode === 'create') {
    const words = createWallet?.mnemonic?.split(/\s+/) ?? [];
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <WrfButton variant="ghost" onClick={() => setMode('choose')} sx={{ alignSelf: 'flex-start' }}>
          Back
        </WrfButton>
        <Typography variant="h6" component="h2">Create a new wallet</Typography>
        {createError && <WrfAlert severity="error">{createError}</WrfAlert>}

        {!createWallet ? (
          <WrfButton variant="primary" onClick={generateWallet} loading={creating}>
            Generate Wallet
          </WrfButton>
        ) : (
          <>
            <WrfAlert severity="warning" title="Back up your recovery phrase">
              Write these 12 words down and store them somewhere safe and
              offline. <strong>This wallet is not saved in this app or in your
              browser: the recovery phrase is the only way to recover it.</strong>{' '}
              If you lose it, you lose access to your wallet and any funds. We
              never see or store this phrase.
            </WrfAlert>
            <MnemonicGrid mnemonic={createWallet.mnemonic ?? ''} />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <input
                type="checkbox"
                id="backup-confirm"
                checked={backupConfirmed}
                onChange={(e) => setBackupConfirmed(e.target.checked)}
              />
              <label htmlFor="backup-confirm" style={{ fontSize: '0.875rem' }}>
                I have securely backed up my 12-word recovery phrase.
              </label>
            </Box>

            {backupConfirmed && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="subtitle2">
                  Confirm your backup — enter the requested words:
                </Typography>
                {verifyIndices.map((idx) => (
                  <WrfInput
                    key={idx}
                    label={`Word #${idx + 1}`}
                    value={verifyInputs[idx] ?? ''}
                    onChange={(e) =>
                      setVerifyInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                    }
                    error={
                      !!verifyInputs[idx] &&
                      verifyInputs[idx].trim().toLowerCase() !== words[idx]
                    }
                    errorMessage="Does not match"
                    fullWidth
                  />
                ))}
              </Box>
            )}

            <WrfButton
              variant="primary"
              onClick={finishCreate}
              loading={loggingIn}
              disabled={!backupConfirmed || !verificationPassed || loggingIn}
            >
              Confirm &amp; Continue
            </WrfButton>
          </>
        )}
      </Box>
    );
  }

  // Pasting an existing recovery phrase / private key was removed (security
  // audit 2026-08-17). `mode` is now only 'choose' | 'create', both handled
  // above; this return is unreachable and exists for exhaustiveness.
  return null;
}

// ---------------------------------------------------------------------------
// Step 2 — Fund (optional faucet)
// ---------------------------------------------------------------------------

interface FundStepProps {
  address: string;
  onContinue: () => void;
}

/**
 * The faucet pays nothing until an operator funds it (owner ruling 2026-10-02 #14: faucet UI at H_F). Same
 * switch as /onboarding: only the exact build value `true` opens the claim (infra#1176 passes it through).
 */
function isFaucetOpen(): boolean {
  return import.meta.env?.VITE_FAUCET_OPEN === 'true';
}

export function FundStep({ address, onContinue }: FundStepProps) {
  const faucetOpen = isFaucetOpen();
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ txHash?: string; amount?: string } | null>(null);

  const claim = useCallback(async () => {
    setError('');
    setClaiming(true);
    try {
      // The canonical faucet contract (/api/onboarding/faucet/*) requires a
      // math-captcha challenge on every claim. The question is a simple
      // "What is A + B?" served to throttle drive-by API abuse, not to
      // distinguish humans — the onboarding wizard answers it inline so a
      // legitimate user isn't quizzed on arithmetic mid-flow.
      const challenge = await stationRegistrationService.requestFaucetChallenge();
      if (!challenge.challengeId || !challenge.question) {
        setError('Faucet challenge unavailable. Try again in a moment.');
        return;
      }
      const parts = challenge.question.match(/What is (\d+) \+ (\d+)\?/);
      if (!parts) {
        setError('Faucet returned an unrecognized challenge. Try again later.');
        return;
      }
      const answer = String(Number(parts[1]) + Number(parts[2]));
      const claimResult = await stationRegistrationService.claimFaucet(
        address,
        challenge.challengeId,
        answer,
      );
      if (!claimResult.success) {
        setError(claimResult.message || 'Faucet claim failed.');
        return;
      }
      setResult({ txHash: claimResult.txHash, amount: claimResult.amount });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Faucet claim failed.');
    } finally {
      setClaiming(false);
    }
  }, [address]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" component="h2">Fund your wallet (optional)</Typography>
      {faucetOpen && (
        <Typography variant="body2" color="text.secondary">
          Claim some free testnet WRF so your wallet can submit transactions.
          You can skip this and do it later.
        </Typography>
      )}
      <WrfAlert severity="warning" title="Testnet faucet">
        {FAUCET_DISCLAIMER}
      </WrfAlert>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Your wallet address
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
          {address}
        </Box>
      </Box>

      {error && <WrfAlert severity="error">{error}</WrfAlert>}

      {!faucetOpen ? (
        <>
          <WrfAlert severity="info" title="The faucet is not funded yet">
            The testnet faucet has no WRF to give out yet. You can register your station now; it does not
            need test tokens.
          </WrfAlert>
          <WrfButton variant="primary" onClick={onContinue}>
            Continue without test tokens
          </WrfButton>
        </>
      ) : result ? (
        <WrfAlert severity="success" title="Funded!">
          {result.amount && <Typography variant="body2">Amount: {result.amount} WRF</Typography>}
          {result.txHash && (
            <Typography variant="body2">
              Tx: <code>{result.txHash.slice(0, 18)}…</code>
            </Typography>
          )}
        </WrfAlert>
      ) : (
        <WrfButton variant="primary" onClick={claim} loading={claiming} disabled={claiming}>
          Claim test WRF from the faucet
        </WrfButton>
      )}

      {faucetOpen && (
        <WrfButton variant="outline" onClick={onContinue}>
          {result ? 'Continue' : 'Skip for now'}
        </WrfButton>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Station details + Ambient key verification
// ---------------------------------------------------------------------------

export interface StationFormData {
  name: string;
  latitude: string;
  longitude: string;
  location: string;
  apiKey: string;
  appKey: string;
  hardware: string;
  mac?: string;
}

interface StationStepProps {
  form: StationFormData;
  setForm: React.Dispatch<React.SetStateAction<StationFormData>>;
  verified: boolean;
  setVerified: (v: boolean) => void;
  onContinue: () => void;
}

export function StationStep({ form, setForm, verified, setVerified, onContinue }: StationStepProps) {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [device, setDevice] = useState<DetectedDevice | null>(null);
  const [locating, setLocating] = useState(false);
  // Monotonic token for the latest verify request. Editing a key bumps this so
  // any in-flight verify response for stale credentials is ignored on return.
  const verifySeq = useRef(0);

  const update = (key: keyof StationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [key]: value }));
    // Any key change invalidates a prior verification and supersedes any
    // verify request currently in flight (its late response must be ignored).
    if (key === 'apiKey' || key === 'appKey') {
      verifySeq.current += 1;
      setVerified(false);
      setDevice(null);
    }
  };

  const useMyLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not available in this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: toRegistrationCoordinate(pos.coords.latitude),
          longitude: toRegistrationCoordinate(pos.coords.longitude),
        }));
        setLocating(false);
      },
      () => {
        setError('Could not read your location. Enter coordinates manually.');
        setLocating(false);
      },
      // 0.1 degree needs no high-accuracy reading.
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [setForm]);

  const verifyKey = useCallback(async () => {
    const submittedApiKey = form.apiKey.trim();
    const submittedAppKey = form.appKey.trim();
    if (!submittedApiKey || !submittedAppKey) {
      setError('Enter both your Ambient API key and Application key.');
      return;
    }
    // Token for this request; if the user edits a key while we're in flight,
    // `update()` bumps verifySeq.current and this response will be discarded.
    verifySeq.current += 1;
    const requestSeq = verifySeq.current;
    setError('');
    setVerifying(true);
    try {
      const result = await stationRegistrationService.verifyStationKey({
        provider: 'ambient',
        apiKey: submittedApiKey,
        appKey: submittedAppKey,
      });
      // Ignore stale responses: the keys have changed since we fired this
      // request, so applying its result could wrongly mark new, unverified
      // credentials as verified.
      if (requestSeq !== verifySeq.current) {
        return;
      }
      if (!result.valid) {
        setVerified(false);
        setDevice(null);
        setError(result.message || 'Those keys were not accepted. Double-check them in your Ambient account.');
        return;
      }
      const detected = result.devices[0] ?? null;
      setDevice(detected);
      setVerified(true);
      // Auto-fill name / coords / mac from the detected device when blank.
      if (detected) {
        setForm((prev) => ({
          ...prev,
          name: prev.name || detected.name || '',
          latitude:
            prev.latitude ||
            (detected.latitude != null ? toRegistrationCoordinate(Number(detected.latitude)) : ''),
          longitude:
            prev.longitude ||
            (detected.longitude != null ? toRegistrationCoordinate(Number(detected.longitude)) : ''),
          mac: detected.mac,
        }));
      }
    } catch (err) {
      // Only surface errors for the still-current request.
      if (requestSeq !== verifySeq.current) {
        return;
      }
      setVerified(false);
      setError(err instanceof Error ? err.message : 'Key verification failed.');
    } finally {
      // Only clear the spinner if this is still the latest request, so a
      // stale resolve doesn't hide an in-flight newer verify.
      if (requestSeq === verifySeq.current) {
        setVerifying(false);
      }
    }
  }, [form.apiKey, form.appKey, setForm, setVerified]);

  const latNum = Number(form.latitude);
  const lonNum = Number(form.longitude);
  const coordsValid =
    form.latitude.trim() !== '' &&
    form.longitude.trim() !== '' &&
    Number.isFinite(latNum) &&
    Number.isFinite(lonNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lonNum >= -180 &&
    lonNum <= 180;

  const canContinue = verified && form.name.trim() !== '' && coordsValid;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" component="h2">Your weather station</Typography>
      <Typography variant="body2" color="text.secondary">
        Provider: <strong>Ambient Weather</strong>. Enter your API and
        Application keys (from your Ambient account) so we can verify and read
        your station.
      </Typography>

      {error && <WrfAlert severity="error">{error}</WrfAlert>}

      <WrfInput
        label="Ambient API Key"
        type="password"
        value={form.apiKey}
        onChange={update('apiKey')}
        onBlur={() => {
          if (form.apiKey.trim() && form.appKey.trim() && !verified) {
            void verifyKey();
          }
        }}
        placeholder="Your Ambient API key"
        fullWidth
      />
      <WrfInput
        label="Ambient Application Key"
        type="password"
        value={form.appKey}
        onChange={update('appKey')}
        onBlur={() => {
          if (form.apiKey.trim() && form.appKey.trim() && !verified) {
            void verifyKey();
          }
        }}
        placeholder="Your Ambient Application key"
        fullWidth
      />

      <WrfButton variant="secondary" onClick={verifyKey} loading={verifying} disabled={verifying}>
        Verify Keys
      </WrfButton>

      {verified && (
        <WrfAlert severity="success" title="Keys verified">
          {device ? (
            <>
              <Typography variant="body2">
                Detected device: <strong>{device.name}</strong>
                {device.mac ? ` (${device.mac})` : ''}
              </Typography>
              {device.latitude != null && device.longitude != null && (
                <Typography variant="body2">
                  Reported location (rounded to 0.1°):{' '}
                  {toRegistrationCoordinate(Number(device.latitude))}, {toRegistrationCoordinate(Number(device.longitude))}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2">Your keys are valid.</Typography>
          )}
        </WrfAlert>
      )}

      <WrfAlert severity="info">
        Your Ambient keys are transmitted over HTTPS and stored{' '}
        <strong>encrypted server-side</strong>. They are only used to read your
        station&apos;s observations.
      </WrfAlert>

      <WrfInput
        label="Station name"
        value={form.name}
        onChange={update('name')}
        placeholder="e.g. Backyard Station"
        helperText={STATION_NAME_PUBLIC_NOTICE}
        fullWidth
      />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <WrfInput
          label="Latitude"
          value={form.latitude}
          onChange={update('latitude')}
          placeholder="37.7749"
          sx={{ flex: 1, minWidth: 140 }}
        />
        <WrfInput
          label="Longitude"
          value={form.longitude}
          onChange={update('longitude')}
          placeholder="-122.4194"
          sx={{ flex: 1, minWidth: 140 }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" data-testid="station-location-rounding-notice">
        {STATION_LOCATION_ROUNDING_NOTICE}
      </Typography>
      <WrfButton variant="ghost" size="sm" onClick={useMyLocation} loading={locating} sx={{ alignSelf: 'flex-start' }}>
        Use my device&apos;s location
      </WrfButton>

      <WrfInput
        label="Location label (optional)"
        value={form.location}
        onChange={update('location')}
        placeholder="e.g. San Francisco, CA"
        fullWidth
      />
      <WrfInput
        label="Hardware model (optional)"
        value={form.hardware}
        onChange={update('hardware')}
        placeholder="e.g. Ambient WS-2902"
        fullWidth
      />

      <WrfButton variant="primary" onClick={onContinue} disabled={!canContinue}>
        Review &amp; Register
      </WrfButton>
      {!verified && (
        <Typography variant="caption" color="text.secondary">
          Verify your Ambient keys to continue.
        </Typography>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Confirm & submit
// ---------------------------------------------------------------------------

interface ConfirmStepProps {
  address: string;
  form: StationFormData;
}

interface RewardProgressPresentation {
  severity: 'info' | 'success' | 'warning';
  title: string;
  detail: React.ReactNode;
}

function presentRewardProgress(
  progress: StationRewardProgress,
): RewardProgressPresentation {
  switch (progress.state) {
  case 'AWAITING_OBSERVATION':
    return {
      severity: 'info',
      title: 'Awaiting first observation',
      detail:
          'No accepted reward-eligible observation is recorded for this station yet.',
    };
  case 'OBSERVATION_RECEIVED':
    return {
      severity: 'info',
      title: 'Observation received',
      detail: (
        <>
            A canonical observation was accepted at{' '}
            <strong>{progress.observation?.acceptedAt}</strong>. This records
            entry into the verification pipeline, not a reward.
          </>
      ),
    };
  case 'VERIFYING':
    return {
      severity: 'info',
      title: 'Verification in progress',
      detail: (
        <>
            {progress.contribution?.approvals} of{' '}
            {progress.contribution?.requiredQuorum} required oracle approvals
            are recorded. No contribution reward is recorded yet.
          </>
      ),
    };
  case 'QUORUM_REACHED':
    return {
      severity: 'info',
      title: 'Oracle quorum reached',
      detail:
          'The required approvals are recorded. The reveal and exact contribution reward are not yet final.',
    };
  case 'FINALIZING_REWARD':
    return {
      severity: 'info',
      title: 'Reward recorded, finalizing',
      detail: (
        <>
            Exact reward entry: <strong>{progress.reward?.amountBaseUnits} base units</strong>{' '}
            in block <strong>{progress.reward?.blockHeight}</strong>. It is not
            presented as final until canonical finality and account
            reconciliation are proven.
          </>
      ),
    };
  case 'REWARDED':
    return {
      severity: 'success',
      title: 'Rewarded',
      detail: (
        <>
            Finalized contribution reward:{' '}
            <strong>{progress.reward?.amountBaseUnits} base units</strong> in
            block <strong>{progress.reward?.blockHeight}</strong>, reconciled
            to this station owner under{' '}
            <strong>{progress.reward?.finalityPolicy}</strong> finality.
          </>
      ),
    };
  case 'UNKNOWN':
  default:
    return {
      severity: 'warning',
      title: 'Reward progress unavailable',
      detail: progress.diagnostic?.code
        ? `The evidence is incomplete or stale (${progress.diagnostic.code}). No reward is claimed.`
        : 'The evidence is incomplete or stale. No reward is claimed.',
    };
  }
}

export function StationRewardProgressPanel({
  stationId,
}: {
  stationId: string;
}) {
  const [progress, setProgress] = useState<StationRewardProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const next = await stationRegistrationService.getStationRewardProgress(
        stationId,
      );
      setProgress(next);
    } catch {
      setProgress(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading && !progress) {
    return (
      <WrfAlert severity="info" title="Checking reward progress">
        Reading the authenticated evidence projection for this station.
      </WrfAlert>
    );
  }

  if (loadError || !progress) {
    return (
      <>
        <WrfAlert severity="warning" title="Reward progress unavailable">
          The evidence service could not confirm this station&apos;s reward
          state. No reward is claimed.
        </WrfAlert>
        <WrfButton variant="outline" onClick={refresh} loading={loading}>
          Retry reward progress
        </WrfButton>
      </>
    );
  }

  const presentation = presentRewardProgress(progress);
  return (
    <>
      <WrfAlert severity={presentation.severity} title={presentation.title}>
        {presentation.detail}
      </WrfAlert>
      <Typography variant="caption" color="text.secondary">
        Evidence checked {progress.asOf}
      </Typography>
      <WrfButton variant="outline" onClick={refresh} loading={loading}>
        Refresh reward progress
      </WrfButton>
    </>
  );
}

export function ConfirmStep({ address, form }: ConfirmStepProps) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stationId, setStationId] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setError('');
    setSubmitting(true);
    try {
      const result = await stationRegistrationService.registerStation({
        name: form.name.trim(),
        latitude: coarsenCoordinate(Number(form.latitude)),
        longitude: coarsenCoordinate(Number(form.longitude)),
        location: form.location.trim() || undefined,
        provider: 'ambient',
        apiKey: form.apiKey.trim(),
        appKey: form.appKey.trim() || undefined,
        hardware: form.hardware.trim() || undefined,
        mac: form.mac,
      });
      setStationId(result.stationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  if (stationId) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
          Station registered
        </Typography>
        <StationRewardProgressPanel stationId={stationId} />
        <WrfCard variant="filled">
          <Typography variant="subtitle2" gutterBottom>
            Station ID
          </Typography>
          <Chip label={stationId} sx={{ fontFamily: 'monospace' }} />
        </WrfCard>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <WrfButton variant="primary" onClick={() => navigate('/map')}>
            View on the Map
          </WrfButton>
          <WrfButton variant="outline" onClick={() => navigate('/')}>
            Return to Dashboard
          </WrfButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" component="h2">Confirm &amp; register</Typography>
      {error && <WrfAlert severity="error">{error}</WrfAlert>}
      <WrfCard variant="outlined">
        <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 1 }}>
          <Typography variant="body2" color="text.secondary">Owner</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{address}</Typography>
          <Typography variant="body2" color="text.secondary">Name</Typography>
          <Typography variant="body2">{form.name}</Typography>
          <Typography variant="body2" color="text.secondary">Coordinates</Typography>
          <Typography variant="body2">
            {toRegistrationCoordinate(Number(form.latitude))}, {toRegistrationCoordinate(Number(form.longitude))} (rounded to 0.1°)
          </Typography>
          {form.location && (
            <>
              <Typography variant="body2" color="text.secondary">Location</Typography>
              <Typography variant="body2">{form.location}</Typography>
            </>
          )}
          {form.hardware && (
            <>
              <Typography variant="body2" color="text.secondary">Hardware</Typography>
              <Typography variant="body2">{form.hardware}</Typography>
            </>
          )}
          <Typography variant="body2" color="text.secondary">Provider</Typography>
          <Typography variant="body2">Ambient Weather</Typography>
        </Box>
      </WrfCard>
      <WrfButton variant="primary" onClick={submit} loading={submitting} disabled={submitting}>
        Register Station
      </WrfButton>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

export default function ConnectStationPage() {
  const [activeStep, setActiveStep] = useState(0);
  // Only the public chain address crosses into page state (see
  // WalletStepProps.onAuthenticated); the signing account never does.
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [verified, setVerified] = useState(false);
  const [form, setForm] = useState<StationFormData>({
    name: '',
    latitude: '',
    longitude: '',
    location: '',
    apiKey: '',
    appKey: '',
    hardware: '',
    mac: undefined,
  });

  const renderStep = () => {
    switch (activeStep) {
    case 0:
      return (
        <WalletStep
          onAuthenticated={(address) => {
            setWalletAddress(address);
            setActiveStep(1);
          }}
        />
      );
    case 1:
      return (
        <FundStep
          address={walletAddress}
          onContinue={() => setActiveStep(2)}
        />
      );
    case 2:
      return (
        <StationStep
          form={form}
          setForm={setForm}
          verified={verified}
          setVerified={setVerified}
          onContinue={() => setActiveStep(3)}
        />
      );
    case 3:
      return <ConfirmStep address={walletAddress} form={form} />;
    default:
      return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
        Connect Your Weather Station
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        Register your Ambient station. Observation and reward progress are
        reported separately when authoritative evidence is available.
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label, i) => (
          <Step key={label} completed={activeStep > i}>
            <StepLabel optional={i === 1 ? <Typography variant="caption">Optional</Typography> : undefined}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <WrfCard>
        <Box sx={{ p: 1 }}>{renderStep()}</Box>
      </WrfCard>
    </Box>
  );
}
