/**
 * Where a website station is on its way to earning, for its owner.
 *
 * A station connected on the website is collected right away, but it earns only once it is registered on
 * chain. That is done in batches, after the owner's 12-word wallet has signed once to say it owns the
 * station. This shows which of these it is and, when the signature is the missing piece, takes it:
 *   one step left (sign) -> connected and waiting -> earning, or blocked with the reason.
 * "Earning" and "blocked" come only from the backend's reading of the chain, never from this page.
 *
 * Used on the connect wizard's last step and on the owner's station page, so an existing station, a
 * reload or a failed first try always has somewhere to sign.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Box } from '@mui/material';
import { WrfAlert, WrfButton, WrfInput } from '../DesignSystem';
import ApiError from '../../utils/apiError';
import { stationRegistrationService, type StationChainRegistration } from '../../services/apiClient';
import { getAuthToken, subscribeAuthToken } from '../../services/authTokenStore';
import { readJwtSubject } from '../../services/walletJwtSubject';
import { signStationOwnership, type StationOwnershipProof } from '../../services/walletCrypto/stationOwnership';
import { withOwnerKey } from '../../services/walletCrypto/deviceSession';
import { loadStoredPasskey } from '../../services/walletCrypto/passkeySend';
import { passkeyRecordAddress } from '../../services/walletCrypto/passkey';
import { readVault } from '../../services/walletVault';
import { WRFCOIN_CHAIN_ID } from '../../config/network';

/** The chain's network name this site is built for (the ownership message names it). */
export const STATION_NETWORK_ID = 'testnet';

/**
 * A wallet that is still in memory and can sign for a station: the brand-new wallet made on the connect
 * page, which is not saved in the browser. It can only produce a station ownership proof for its own
 * address; `release` drops the key. It is released as soon as it can no longer be needed: the proof
 * was accepted, the server refused it for good, the station is not waiting for a signature, the server
 * reports no registration state, or ten minutes have passed (see ConnectStationPage).
 */
export interface StationOwnershipSigner {
  sign: (stationId: string, chain: { chainId: string; networkId: string }) => StationOwnershipProof;
  release: () => void;
}

function errorCode(error: unknown): string {
  if (!(error instanceof ApiError)) return '';
  const details = error.details as { code?: unknown; error?: { code?: unknown } } | undefined;
  const code = details?.code ?? details?.error?.code;
  return typeof code === 'string' ? code : '';
}

/** What to tell the owner when the server refuses a signature, and whether trying the same thing again can help. */
export function describeProofRejection(error: unknown, chainId: string): { message: string; retry: boolean } {
  const status = error instanceof ApiError ? error.status : 0;
  const code = errorCode(error);
  if (code === 'OWNER_KEY_NOT_THIS_WALLET' || status === 409) {
    return {
      retry: false,
      message: 'The wallet that signed is not the wallet signed in on this site. Sign in with the 12-word '
        + 'wallet that owns this station, then sign again.',
    };
  }
  if (code === 'OWNERSHIP_SIGNATURE_INVALID') {
    return {
      retry: false,
      message: `The server did not accept the signature (it checks stations for chain ${chainId}). Nothing was `
        + 'saved. Reload this page and sign again from this station\'s page.',
    };
  }
  if (status === 404) {
    return {
      retry: false,
      message: 'This station is not registered to the wallet signed in on this site, or signing for stations is '
        + 'not switched on yet. Nothing was saved.',
    };
  }
  if (status === 400) {
    return { retry: false, message: 'The server did not accept the signature. Nothing was saved. Reload this page and sign again.' };
  }
  if (status === 401) {
    return {
      retry: false,
      message: 'Your wallet session ended, so nothing was saved. Sign in with the 12-word wallet that owns this '
        + 'station (if it is not saved in this browser, restore it on the Wallet page with your 12 words), then '
        + 'sign from this station\'s page.',
    };
  }
  return { retry: true, message: 'Your signature could not be saved just now. Please try again.' };
}

export function StationChainRegistrationNotice({
  registration,
  ownerAddress,
  signer,
  onChanged,
}: {
  registration: StationChainRegistration;
  ownerAddress: string;
  /** Present only while a brand-new wallet is still in memory. */
  signer?: StationOwnershipSigner;
  onChanged: () => void;
}) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{ message: string; retry: boolean } | null>(null);
  const autoTried = useRef(false);
  const owner = ownerAddress.toLowerCase();
  const savedHere = useMemo(() => readVault()?.address.toLowerCase() === owner, [owner]);
  const passkeyOwned = useMemo(() => {
    try {
      const stored = loadStoredPasskey();
      return stored !== null && passkeyRecordAddress(stored).toLowerCase() === owner;
    } catch {
      return false;
    }
  }, [owner]);
  const siteChainId = WRFCOIN_CHAIN_ID ?? '';
  const chainMatches = siteChainId === registration.chainId && STATION_NETWORK_ID === registration.networkId;
  const chain = useMemo(
    () => ({ chainId: registration.chainId, networkId: registration.networkId }),
    [registration.chainId, registration.networkId],
  );

  const send = useCallback(async (proof: StationOwnershipProof) => {
    try {
      await stationRegistrationService.submitStationOwnershipProof(registration.stationId, proof);
      setFailure(null);
      // Accepted: a wallet kept in memory only for this is no longer needed.
      signer?.release();
      onChanged();
    } catch (error) {
      const rejection = describeProofRejection(error, registration.chainId);
      setFailure(rejection);
      // Refused for good: this key can do nothing more here, so it is dropped now.
      if (!rejection.retry) signer?.release();
    }
  }, [registration.stationId, registration.chainId, signer, onChanged]);

  const signWithMemoryWallet = useCallback(async () => {
    if (!signer) return;
    setBusy(true);
    try {
      let proof: StationOwnershipProof;
      try {
        proof = signer.sign(registration.stationId, chain);
      } catch {
        setFailure({ retry: false, message: 'This wallet could not sign for the station. Nothing was sent.' });
        signer.release();
        return;
      }
      await send(proof);
    } finally {
      setBusy(false);
    }
  }, [signer, registration.stationId, chain, send]);

  // A brand-new wallet is only in memory: sign and hand in once, without asking, while it is still here.
  const needsSignature = registration.state === 'needs_owner_signature';
  // The key is kept only while it can still be used for this: not once the station is past the
  // signature step, and not when this site cannot sign for the server's chain.
  useEffect(() => {
    if (signer && (!needsSignature || !chainMatches)) signer.release();
  }, [signer, needsSignature, chainMatches]);
  useEffect(() => {
    if (!needsSignature || !signer || !chainMatches || autoTried.current) return;
    autoTried.current = true;
    void signWithMemoryWallet();
  }, [needsSignature, signer, chainMatches, signWithMemoryWallet]);

  const signWithSavedWallet = useCallback(async () => {
    if (!password) return;
    setFailure(null);
    setBusy(true);
    try {
      let proof: StationOwnershipProof;
      try {
        proof = await withOwnerKey(owner, password, (account) =>
          signStationOwnership(account, registration.stationId, chain));
      } catch {
        setFailure({ retry: true, message: 'That password did not unlock your 12-word wallet. Nothing was signed.' });
        return;
      } finally {
        setPassword('');
      }
      await send(proof);
    } finally {
      setBusy(false);
    }
  }, [owner, password, registration.stationId, chain, send]);

  if (registration.state === 'earning') {
    return (
      <WrfAlert severity="success" title="Earning" data-testid="station-chain-earning">
        This station is registered on chain. Rewards for its readings are listed as they are recorded.
      </WrfAlert>
    );
  }

  if (registration.state === 'blocked') {
    return (
      <WrfAlert severity="error" title="This station can't be registered on chain as it is" data-testid="station-chain-blocked">
        {registration.blockedReason === 'chain_record_not_active'
          ? 'The chain has this station, but shows it as not active, so it is not earning. Nothing you sign here can change that; ask the network operator.'
          : 'This station id is already used on chain by another wallet, so this station can\'t be registered under it and is not earning. A station keeps the id it was given; connecting it again does not give it a new one. Nothing you do on this page can change that; ask the network operator.'}
      </WrfAlert>
    );
  }

  if (registration.state === 'waiting') {
    if (registration.waitingFor === 'station_report') {
      return (
        <WrfAlert severity="warning" title="Connected. Waiting for your station to report" data-testid="station-chain-waiting-report">
          Your wallet has signed for this station. It isn&apos;t earning yet, and it can&apos;t join an on-chain
          registration batch until its data collection is active and it has sent a reading in the last
          24 hours. Check that the station is online and that its Ambient keys still work.
        </WrfAlert>
      );
    }
    if (registration.waitingFor === 'operator_review') {
      return (
        <WrfAlert severity="info" title="Connected. Waiting for the operator" data-testid="station-chain-waiting-operator">
          Your wallet has signed for this station. It isn&apos;t earning yet. Its id ({registration.stationId})
          was made from the name you gave it, and a station id is public on the chain for good. Older
          stations like this one keep their id, so the network operator adds them one at a time. You
          don&apos;t need to do anything, and there is nothing to do on this page to speed it up.
        </WrfAlert>
      );
    }
    return (
      <WrfAlert severity="info" title="Connected. Waiting for on-chain registration" data-testid="station-chain-waiting">
        Your station is connected and its weather data is collected. It isn&apos;t earning yet: stations are
        registered on chain in batches, and yours is in the queue. It starts earning once its batch is on
        chain. You don&apos;t need to do anything.
      </WrfAlert>
    );
  }

  if (passkeyOwned && !signer) {
    return (
      <WrfAlert severity="info" title="Not earning yet" data-testid="station-chain-passkey-owned">
        A passkey wallet owns this station. Passkey-owned stations can&apos;t be registered on chain yet, so
        it isn&apos;t earning. Its weather data is collected, and you don&apos;t need to do anything: it can be
        registered once the chain accepts passkey owners.
      </WrfAlert>
    );
  }

  if (!chainMatches) {
    return (
      <WrfAlert severity="error" title="Signing is switched off on this site for now" data-testid="station-chain-mismatch">
        This station is not earning yet and needs your wallet&apos;s signature, but this site is built for
        chain {siteChainId || 'none'} ({STATION_NETWORK_ID}) and the server registers stations on
        chain {registration.chainId} ({registration.networkId}). Nothing was signed. This is a problem
        with the site, not with your station or wallet.
      </WrfAlert>
    );
  }

  return (
    <WrfAlert severity="warning" title="One step left before this station can earn" data-testid="station-chain-needs-signature">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start', textAlign: 'left' }}>
        <span>
          Your station is connected and its weather data is collected. To earn, it has to be registered on
          chain, and for that your wallet signs once to say it owns this station. Signing is free and moves
          no coins.
        </span>
        <span data-testid="station-chain-public-warning">
          <strong>What becomes public, permanently:</strong> the station id ({registration.stationId}) and
          the station&apos;s position rounded to 0.1 degree go on the chain with your wallet address, and
          can&apos;t be removed later.
        </span>
        {failure && <span role="alert" data-testid="station-chain-failure">{failure.message}</span>}
        {signer ? (
          busy ? <span>Signing for your station and saving it.</span> : failure?.retry !== false ? (
            <WrfButton variant="outline" onClick={signWithMemoryWallet} disabled={busy}>
              {failure ? 'Try again' : 'Sign for my station'}
            </WrfButton>
          ) : null
        ) : savedHere ? (
          <>
            <WrfInput
              label="Wallet password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              fullWidth
            />
            <WrfButton variant="primary" onClick={signWithSavedWallet} loading={busy} disabled={busy || !password}>
              Sign for my station
            </WrfButton>
          </>
        ) : (
          <span data-testid="station-chain-no-wallet-here">
            This browser has no saved 12-word wallet for this station&apos;s owner. Open this station&apos;s
            page in the browser where that wallet is saved, or restore it on the Wallet page with your 12
            words; the same sign button is shown there.
          </span>
        )}
      </Box>
    </WrfAlert>
  );
}

/**
 * The owner's station page: the registration status, and the sign step when it is missing. Renders
 * nothing unless a wallet is signed in, it owns this station, and the backend reports the state.
 */
export function StationChainRegistrationCard({ stationId }: { stationId: string }) {
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  const subject = token ? readJwtSubject(token) : null;
  const [view, setView] = useState<{ ownerAddress: string; registration: StationChainRegistration } | null>(null);
  // Only the newest request may set what is shown: an answer for the account that was signed in
  // before, or for another station, is dropped when it arrives late.
  const latest = useRef(0);

  const load = useCallback(async (reuseRecent = false) => {
    const mine = ++latest.current;
    if (!subject) {
      setView(null);
      return;
    }
    try {
      // First paint may take the answer the page read a moment ago (who owns this station), so the
      // page asks once. A read after signing always asks again.
      const next = await stationRegistrationService.getStationChainRegistration(stationId, { reuseRecent });
      if (latest.current !== mine) return;
      setView(
        next && next.chainRegistration && next.ownerAddress.toLowerCase() === subject.toLowerCase()
          ? { ownerAddress: next.ownerAddress, registration: next.chainRegistration }
          : null,
      );
    } catch {
      // Not the owner, signed out, or the route is not live: this card simply is not shown.
      if (latest.current === mine) setView(null);
    }
  }, [stationId, subject]);

  useEffect(() => {
    // Another account or station: what was shown belongs to the old one, so it goes at once.
    setView(null);
    void load(true);
    return () => { latest.current += 1; };
  }, [load]);

  if (!view) return null;
  return (
    <Box data-testid="station-chain-registration-card" sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
      <StationChainRegistrationNotice
        registration={view.registration}
        ownerAddress={view.ownerAddress}
        onChanged={() => { void load(); }}
      />
    </Box>
  );
}
