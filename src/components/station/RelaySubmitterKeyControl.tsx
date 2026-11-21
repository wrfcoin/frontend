import React, { useMemo, useState } from 'react';
import ApiError from '../../utils/apiError';
import { isStationAlias, stationAlias } from '../../utils/stationAlias';
import { ownershipStatus, type StationOwnershipView } from '../../utils/stationOwnership';
import { readVault } from '../../services/walletVault';
import {
  normalizeSubmitterKeyInput,
  signSubmitterKeyAction,
  submitSubmitterKeyAction,
  submitterKeyInputError,
} from '../../services/walletCrypto/stationSubmitterKey';

export const RELAY_KEY_NOT_ACTIVE_MESSAGE =
  'Approving a relay key (for example a house collector that sends this station\'s readings) is not switched on for '
  + 'this network yet. Nothing can be signed here until the chain turns it on.';
export const RELAY_KEY_FROZEN_MESSAGE = 'A frozen or deactivated station cannot approve a relay key.';
export const RELAY_KEY_NO_VAULT_MESSAGE =
  'To sign, unlock the 12-word wallet that owns this station in this browser first. A phone key is approved from the phone app.';
export const RELAY_KEY_PENDING_MESSAGE =
  'Sent. The chain has not applied it yet: it can still refuse it when the block is made. Check again in a few minutes.';

type Mode = { kind: 'set'; key: string } | { kind: 'clear' };
type Phase = { kind: 'edit' } | { kind: 'review'; mode: Mode } | { kind: 'busy' } | { kind: 'sent' } | { kind: 'error'; message: string };

/**
 * `set_submitter_key` from the website (core4 `station_submitter_key`): the owner approves ONE Relay key that may submit
 * readings for this station, or clears it. Device keys are phone-only. Offered only to the signed-in owner, only when the
 * ownership read reports the feature active, and only for an active (not frozen or deactivated) station.
 */
export default function RelaySubmitterKeyControl({
  stationId,
  ownership,
  onSent,
}: {
  stationId: string;
  ownership: StationOwnershipView;
  onSent?: () => void;
}) {
  if (!ownership.isOwner) return null;
  return (
    <div data-testid="relay-submitter-key" style={{ marginTop: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Relay key</h3>
      {!ownership.submitterKeyActive ? (
        <p data-testid="relay-key-inactive">{RELAY_KEY_NOT_ACTIVE_MESSAGE}</p>
      ) : ownershipStatus(ownership) !== 'active' ? (
        <p>{RELAY_KEY_FROZEN_MESSAGE}</p>
      ) : (
        <RelayKeyForm stationId={stationId} ownership={ownership} onSent={onSent} />
      )}
    </div>
  );
}

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.message) return error.message;
  if (error instanceof ApiError) return 'The relay is not reachable right now. Nothing was applied; try again shortly.';
  return error instanceof Error && error.message ? error.message : 'Something went wrong. Nothing was applied.';
}

const field: React.CSSProperties = { display: 'block', width: '100%', maxWidth: 560, boxSizing: 'border-box', padding: '8px 10px', fontFamily: 'monospace', fontSize: 14, marginTop: 4 };
const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 };

function RelayKeyForm({ stationId, ownership, onSent }: { stationId: string; ownership: StationOwnershipView; onSent?: () => void }) {
  const vaultAddress = useMemo(() => readVault()?.address.toLowerCase() ?? null, []);
  const ownerAddress = ownership.owner?.toLowerCase() ?? null;
  const [rawKey, setRawKey] = useState('');
  const [rawStationId, setRawStationId] = useState(isStationAlias(stationId) ? '' : stationId);
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'edit' });
  const [touched, setTouched] = useState(false);

  if (!vaultAddress || !ownerAddress || vaultAddress !== ownerAddress) {
    return <p>{RELAY_KEY_NO_VAULT_MESSAGE}</p>;
  }

  const key = normalizeSubmitterKeyInput(rawKey);
  const keyError = submitterKeyInputError(key);
  const needsStationId = isStationAlias(stationId);
  const stationIdError = needsStationId && rawStationId.trim() !== '' && stationAlias(rawStationId.trim()) !== stationId
    ? 'That is not this station\'s id.'
    : needsStationId && rawStationId.trim() === '' ? 'Enter this station\'s id (it is part of what you sign).' : null;

  const sign = async (mode: Mode) => {
    setPhase({ kind: 'busy' });
    const pw = password;
    setPassword('');
    try {
      const signedStationId = needsStationId ? rawStationId.trim() : stationId;
      const payload = await signSubmitterKeyAction({
        stationId: signedStationId,
        ownerAddress,
        ownerNonce: ownership.ownerNonce,
        observedAtHeight: ownership.observedAtHeight,
        relayPubkey: mode.kind === 'set' ? mode.key : null,
      }, pw);
      await submitSubmitterKeyAction(signedStationId, payload);
      setPhase({ kind: 'sent' });
      setRawKey('');
      onSent?.();
    } catch (error) {
      setPhase({ kind: 'error', message: errorText(error) });
    }
  };

  if (phase.kind === 'sent') {
    return (
      <>
        <p role="status" data-testid="relay-key-sent">{RELAY_KEY_PENDING_MESSAGE}</p>
        <button type="button" onClick={() => setPhase({ kind: 'edit' })}>Done</button>
      </>
    );
  }

  if (phase.kind === 'review' || phase.kind === 'busy') {
    const mode = phase.kind === 'review' ? phase.mode : null;
    return (
      <form onSubmit={(e) => { e.preventDefault(); if (mode && password) void sign(mode); }}>
        {mode?.kind === 'set' && (
          <p data-testid="relay-key-review">
            Approve <code style={{ wordBreak: 'break-all' }}>{mode.key}</code> as this station's relay key. It can then send
            readings for this station. A key approved before is replaced.
          </p>
        )}
        {mode?.kind === 'clear' && (
          <p data-testid="relay-key-review">Remove this station's approved submitter key. Only the owner key can then send readings.</p>
        )}
        {phase.kind === 'busy' && <p role="status">Signing and sending…</p>}
        <label>
          Wallet password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={field} disabled={phase.kind === 'busy'} />
        </label>
        <div style={row}>
          <button type="submit" disabled={!password || phase.kind === 'busy'}>Sign and send</button>
          <button type="button" onClick={() => { setPassword(''); setPhase({ kind: 'edit' }); }} disabled={phase.kind === 'busy'}>Back</button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!keyError && !stationIdError) setPhase({ kind: 'review', mode: { kind: 'set', key } }); }}>
      <p>
        Approve one relay key (for example a house collector) that may send readings for this station. Your owner key
        signs it. Approving a new key replaces the old one. A phone key is approved from the phone app.
      </p>
      {needsStationId && (
        <label style={{ display: 'block', marginBottom: 8 }}>
          Station id
          <input value={rawStationId} onChange={(e) => setRawStationId(e.target.value)} onBlur={() => setTouched(true)} autoComplete="off" spellCheck={false} style={field} aria-invalid={touched && !!stationIdError} />
          {touched && stationIdError && <span role="alert" style={{ display: 'block', marginTop: 4 }}>{stationIdError}</span>}
        </label>
      )}
      <label style={{ display: 'block' }}>
        Relay public key (64 hex characters)
        <input value={rawKey} onChange={(e) => setRawKey(e.target.value)} onBlur={() => setTouched(true)} autoComplete="off" spellCheck={false} placeholder="e.g. 3b6a27bc…" style={field} aria-invalid={touched && !!keyError} data-testid="relay-key-input" />
        {touched && rawKey !== '' && keyError && <span role="alert" style={{ display: 'block', marginTop: 4 }}>{keyError}</span>}
      </label>
      {phase.kind === 'error' && <p role="alert">{phase.message}</p>}
      <div style={row}>
        <button type="submit" disabled={!!keyError || !!stationIdError}>Approve relay key</button>
        <button
          type="button"
          disabled={!!stationIdError}
          onClick={() => { setTouched(true); if (!stationIdError) setPhase({ kind: 'review', mode: { kind: 'clear' } }); }}
        >
          Clear submitter key
        </button>
      </div>
    </form>
  );
}
