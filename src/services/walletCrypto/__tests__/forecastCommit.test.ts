/**
 * Website forecast commit (design 2026-11-05): the commit authorization bytes match core4's
 * commit_authorization_message_with_domain layout, and a draft that differs from what the person asked for
 * in any signed respect is refused before anything is signed.
 */
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, deriveAccount } from '../firstPartyKeys';
import {
  DraftMismatch, forecastCommitId, forecastCommitMessage, roundForecastValue, signForecastCommit, stationAliasOf,
  verifyForecastDraft, type ForecastDraft, type ForecastIntent,
} from '../forecastCommit';

const enc = new TextEncoder();
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const account = deriveAccount(MNEMONIC);
const STATION = 'PWS-TEST-0001';
const T = 1_794_000_000;

function draftFor(over: Partial<{ value: number; lead: number; station: string; variable: string; forecaster: string }> = {}): ForecastDraft {
  const lead = over.lead ?? 6;
  const station = over.station ?? STATION;
  const variable = over.variable ?? 'temperature_c';
  const value = over.value ?? 12.3;
  // Canonical: sorted keys, compact (what the backend writes and serde_json re-serializes).
  const data = `{"horizon_hours":${lead},"issued_at":${T},"model_id":"website-manual/v1","station_id":"${station}","valid_at":${T + lead * 3600},"values":{"${variable}":${value}}}`;
  const nonce = 'web-0123456789abcdef';
  return {
    forecaster: over.forecaster ?? account.address, stationAlias: stationAliasOf(station), stationId: station, variable, leadHours: lead, value,
    data, nonce, timestamp: T, commitId: forecastCommitId(data, nonce, station, T), issuedAt: T, validAt: T + lead * 3600,
  };
}
const intent = (over: Partial<ForecastIntent> = {}): ForecastIntent => ({
  wallet: account.address, stationAlias: stationAliasOf(STATION), variable: 'temperature_c', leadHours: 6, value: 12.3, ...over,
});

describe('forecastCommitMessage', () => {
  it('is the raw domain tag then u32le-length-prefixed chain, network, station, commit id and type', () => {
    const commitId = 'ab'.repeat(32);
    const msg = forecastCommitMessage({ chainId: '888', networkId: 'testnet', stationId: 'S1', commitId });
    const expectedHex =
      bytesToHex(enc.encode('wrfcoin_commit_auth_v2'))
      + '03000000' + bytesToHex(enc.encode('888'))
      + '07000000' + bytesToHex(enc.encode('testnet'))
      + '02000000' + bytesToHex(enc.encode('S1'))
      + '40000000' + bytesToHex(enc.encode(commitId))
      + '08000000' + bytesToHex(enc.encode('forecast'));
    expect(bytesToHex(msg)).toBe(expectedHex);
    expect(msg.length).toBe(22 + 4 + 3 + 4 + 7 + 4 + 2 + 4 + 64 + 4 + 8);
  });
});

describe('hashes', () => {
  it('derives the commit id like core4 compute_commit_id', () => {
    expect(forecastCommitId('{"a":1}', 'n', 'S', 5)).toBe(bytesToHex(sha3_256(enc.encode('{"a":1}||n||S||5||forecast'))));
  });
  it('derives the public station alias like the backend', () => {
    const expected = `st_${bytesToHex(sha256(enc.encode(`wrfcoin-station-alias-v1:${STATION}`))).slice(0, 12)}`;
    expect(stationAliasOf(STATION)).toBe(expected);
    expect(stationAliasOf(STATION)).toMatch(/^st_[0-9a-f]{12}$/);
  });
  it('rounds to one decimal', () => {
    expect(roundForecastValue(12.34)).toBe(12.3);
    expect(roundForecastValue(-0.05)).toBe(-0);
    expect(roundForecastValue(1013.26)).toBe(1013.3);
  });
});

describe('verifyForecastDraft', () => {
  it('accepts a draft that matches the request and returns the station to sign over', () => {
    expect(verifyForecastDraft(draftFor(), intent())).toEqual({ stationId: STATION });
  });
  it.each([
    ['a different value', draftFor({ value: 15 }), intent()],
    ['a different lead', draftFor({ lead: 12 }), intent()],
    ['a different station', draftFor({ station: 'PWS-OTHER' }), intent()],
    ['a different variable', draftFor({ variable: 'pressure_hpa' }), intent()],
    ['a different wallet', draftFor({ forecaster: '0x' + '11'.repeat(20) }), intent()],
  ])('refuses %s', (_label, draft, want) => {
    expect(() => verifyForecastDraft(draft, want)).toThrow(DraftMismatch);
  });
  it('refuses a commit id that does not re-hash', () => {
    expect(() => verifyForecastDraft({ ...draftFor(), commitId: 'cd'.repeat(32) }, intent())).toThrow(/commit id/);
  });
  it('refuses data edited after the commit id was computed', () => {
    const d = draftFor();
    expect(() => verifyForecastDraft({ ...d, data: d.data.replace('12.3', '12.4') }, intent())).toThrow(DraftMismatch);
  });
  it('refuses a second variable smuggled into values', () => {
    const d = draftFor();
    const data = d.data.replace('{"temperature_c":12.3}', '{"pressure_hpa":1000,"temperature_c":12.3}');
    expect(() => verifyForecastDraft({ ...d, data, commitId: forecastCommitId(data, d.nonce, STATION, T) }, intent())).toThrow(/variable/);
  });
});

describe('signForecastCommit', () => {
  it('signs the commit message with the wallet key; the signature verifies under the wallet public key', () => {
    const d = draftFor();
    const body = signForecastCommit(d, STATION, { chainId: '888', networkId: 'testnet' }, account);
    expect(body.authPubkey).toBe(bytesToHex(account.publicKey));
    expect(body.authSignature).toMatch(/^[0-9a-f]{128}$/);
    const msg = forecastCommitMessage({ chainId: '888', networkId: 'testnet', stationId: STATION, commitId: d.commitId });
    expect(ed25519.verify(Uint8Array.from(Buffer.from(body.authSignature, 'hex')), msg, account.publicKey)).toBe(true);
    expect(body).toMatchObject({ data: d.data, nonce: d.nonce, timestamp: T, commitId: d.commitId });
    // Address binding the relay checks: forecaster == sha3_256(pubkey)[..20].
    expect(`0x${bytesToHex(sha3_256(account.publicKey).slice(0, 20))}`).toBe(account.address);
  });
});
