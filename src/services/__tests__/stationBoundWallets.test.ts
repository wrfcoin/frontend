/**
 * @jest-environment jsdom
 */
// The station record that keeps a station-owning wallet from being removed, and the storage layout it sits
// next to: the two wallet slots are never rewritten by it, so a release rolled back still reads them.
import { markStationBound, stationBound } from '../stationBoundWallets';
import { clearStoredPasskey, loadStoredPasskey, saveStoredPasskey } from '../walletCrypto/passkeySend';
import { clearVault, readVault } from '../walletVault';

const MARKER_KEY = 'wrfcoin.wallet.station_bound.v1';
const VAULT_KEY = 'wrfcoin_wallet_vault_v1';
const PASSKEY_KEY = 'wrfcoin.passkey.credential.v1';
const A = `0x${'ab'.repeat(20)}`;
const B = `0x${'cd'.repeat(20)}`;
// A vault record exactly as the single-wallet release wrote it.
const OLD_VAULT = JSON.stringify({
  v: 1, scheme: 'ed25519-slip10-master-v1', address: A,
  kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600_000, salt: 'AA==' },
  cipher: { name: 'AES-GCM', iv: 'AA==' }, ct: 'AA==',
});
const OLD_PASSKEY = JSON.stringify({ credentialId: '01'.repeat(16), publicKeyXY: '02'.repeat(64), rpId: 'wrfcoin.com' });

beforeEach(() => localStorage.clear());

describe('station record', () => {
  it('a wallet with no record is not bound', () => {
    expect(stationBound(A)).toEqual({ bound: false });
  });

  it('records a station under the lower-cased owner, adds a second, and never duplicates', () => {
    markStationBound(A.toUpperCase().replace('0X', '0x'), 'st_1');
    markStationBound(A, 'st_1');
    markStationBound(A, 'st_2');
    expect(stationBound(A)).toEqual({ bound: true, stationIds: ['st_1', 'st_2'] });
    expect(stationBound(B)).toEqual({ bound: false });
  });

  it('keeps another wallet\'s entry when one is added', () => {
    markStationBound(A, 'st_1');
    markStationBound(B, 'st_9');
    expect(stationBound(A)).toEqual({ bound: true, stationIds: ['st_1'] });
    expect(stationBound(B)).toEqual({ bound: true, stationIds: ['st_9'] });
  });

  it('ignores a missing owner or a malformed station id', () => {
    markStationBound(null, 'st_1');
    markStationBound('not-an-address', 'st_1');
    markStationBound(A, 'bad id!');
    expect(localStorage.getItem(MARKER_KEY)).toBeNull();
  });

  it('an unreadable record counts as bound and is never overwritten', () => {
    localStorage.setItem(MARKER_KEY, '{broken');
    expect(stationBound(A)).toEqual({ bound: true, stationIds: [] });
    markStationBound(A, 'st_1');
    expect(localStorage.getItem(MARKER_KEY)).toBe('{broken');
  });
});

describe('storage layout: no migration, rollback-safe', () => {
  it('a single-wallet browser is read as it is, and the station record leaves both slots byte for byte', () => {
    localStorage.setItem(VAULT_KEY, OLD_VAULT);
    expect(readVault()?.address).toBe(A);
    markStationBound(A, 'st_1');
    expect(localStorage.getItem(VAULT_KEY)).toBe(OLD_VAULT);
    expect(Object.keys(localStorage).sort()).toEqual([MARKER_KEY, VAULT_KEY].sort());
  });

  it('adding a passkey wallet next to a 12-word wallet does not touch the vault, and the other way round', () => {
    localStorage.setItem(VAULT_KEY, OLD_VAULT);
    localStorage.setItem(PASSKEY_KEY, OLD_PASSKEY);
    const record = loadStoredPasskey();
    expect(record).not.toBeNull();
    saveStoredPasskey(record!);
    expect(localStorage.getItem(VAULT_KEY)).toBe(OLD_VAULT);
    expect(localStorage.getItem(PASSKEY_KEY)).toBe(OLD_PASSKEY);
  });

  it('removing one wallet leaves the other slot byte for byte', () => {
    localStorage.setItem(VAULT_KEY, OLD_VAULT);
    localStorage.setItem(PASSKEY_KEY, OLD_PASSKEY);
    clearVault();
    expect(localStorage.getItem(PASSKEY_KEY)).toBe(OLD_PASSKEY);
    localStorage.setItem(VAULT_KEY, OLD_VAULT);
    clearStoredPasskey();
    expect(localStorage.getItem(VAULT_KEY)).toBe(OLD_VAULT);
  });

  it('a rolled-back release (which knows only the two slots) still reads both after the new record exists', () => {
    localStorage.setItem(VAULT_KEY, OLD_VAULT);
    localStorage.setItem(PASSKEY_KEY, OLD_PASSKEY);
    markStationBound(A, 'st_1');
    // The old code paths: readVault and loadStoredPasskey, nothing else.
    expect(readVault()?.address).toBe(A);
    expect(loadStoredPasskey()?.rpId).toBe('wrfcoin.com');
  });
});
