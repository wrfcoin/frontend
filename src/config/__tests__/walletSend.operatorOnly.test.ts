/**
 * Owner ruling 2026-10-15: public wallet Send joins the existing operator
 * preview gate. Both paths keep strict flag parsing; the page independently
 * requires its unlocked first-party identity and matching vault.
 */
import { readFileSync } from 'node:fs';

import { isPublicReadonlyEnabled, isPublicTestnetPath, isWalletSendEnabled } from '../contractSurfacePolicy';

const MALFORMED = [undefined, null, '', 'false', 'TRUE', 'True', '1', 'yes', true, 1, ' true', 'true '];

describe('isWalletSendEnabled', () => {
  it('owner 2026-10-15 public parity enables send only with the exact public flag', () => {
    expect(isWalletSendEnabled(undefined, undefined, 'true')).toBe(true);
    for (const value of MALFORMED) expect(isWalletSendEnabled(undefined, undefined, value)).toBe(false);
  });
  it('without public or preview flags keeps send off, with or without full studio', () => {
    expect(isWalletSendEnabled(undefined, undefined)).toBe(false);
    expect(isWalletSendEnabled('', '')).toBe(false);
    expect(isWalletSendEnabled('true', undefined)).toBe(false);
    expect(isWalletSendEnabled('true', '')).toBe(false);
  });

  it('operator preview build (full studio + preview, exact "true") turns send on', () => {
    expect(isWalletSendEnabled('true', 'true')).toBe(true);
  });

  it('preview alone, without full studio, keeps send off', () => {
    expect(isWalletSendEnabled(undefined, 'true')).toBe(false);
  });

  it.each(MALFORMED)('malformed value %p on either flag keeps send off', value => {
    expect(isWalletSendEnabled(value, 'true')).toBe(false);
    expect(isWalletSendEnabled('true', value)).toBe(false);
  });

  it('is on exactly when /wallet is reachable', () => {
    for (const fullStudio of [undefined, 'true']) {
      for (const preview of [undefined, 'true']) {
        const walletReachable = isPublicTestnetPath(
          '/wallet',
          fullStudio === 'true',
          false,
          preview === 'true',
        );
        expect(isWalletSendEnabled(fullStudio, preview)).toBe(walletReachable);
      }
    }
  });
});

describe('Send kill switch (VITE_DISABLE_WALLET_SEND)', () => {
  it('defaults ON for the public build: unset or non-"true" kill values leave Send enabled', () => {
    for (const kill of [undefined, '', 'false', 'TRUE', '1', true, ' true']) {
      expect(isWalletSendEnabled(undefined, undefined, 'true', kill)).toBe(true);
    }
  });
  it('the exact string "true" turns Send OFF for public and operator builds', () => {
    expect(isWalletSendEnabled(undefined, undefined, 'true', 'true')).toBe(false);
    expect(isWalletSendEnabled('true', 'true', undefined, 'true')).toBe(false);
  });
  it('is independent of the read-only flag: read-only stays on while Send is off', () => {
    expect(isPublicReadonlyEnabled('true')).toBe(true);
    expect(isWalletSendEnabled(undefined, undefined, 'true', 'true')).toBe(false);
  });
});

describe('FEATURES.walletSend', () => {
  it('is false with no build env', async () => {
    const { FEATURES } = await import('../features');
    expect(FEATURES.walletSend).toBe(false);
  });

  it('is derived from the strict public and operator flags', () => {
    const source = readFileSync('src/config/features.ts', 'utf8');
    expect(source).toMatch(/walletSend: WALLET_SEND,/);
    expect(source).toMatch(
      /const WALLET_SEND = isWalletSendEnabled\(\s*import\.meta\.env\?\.VITE_ENABLE_FULL_STUDIO,\s*import\.meta\.env\?\.VITE_ENABLE_OPERATOR_PREVIEW,\s*import\.meta\.env\?\.VITE_PUBLIC_READONLY_PATHS,\s*import\.meta\.env\?\.VITE_DISABLE_WALLET_SEND,\s*\);/,
    );
  });
});
