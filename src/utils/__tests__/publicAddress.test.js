import { defaultNodeName, isFullAddress, mayBeWallet, profileSegment, sameWallet, shortAddr } from '../publicAddress';

const FULL = '0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1';
const NATIVE = `wrf${'c3'.repeat(20)}`;

describe('publicAddress (backend#1361)', () => {
  test('shortAddr keeps 6 + 4 characters and is idempotent', () => {
    expect(shortAddr(FULL)).toBe('0xa1a1…a1a1');
    expect(shortAddr(shortAddr(FULL))).toBe('0xa1a1…a1a1');
    expect(shortAddr(null)).toBe('');
  });

  test('isFullAddress accepts 0x and wrf forms only', () => {
    expect(isFullAddress(FULL)).toBe(true);
    expect(isFullAddress(NATIVE)).toBe(true);
    expect(isFullAddress('0xa1a1…a1a1')).toBe(false);
    expect(isFullAddress('c_0123456789abcdef01234567')).toBe(false);
    expect(isFullAddress(undefined)).toBe(false);
  });

  test('sameWallet is an exact, case-insensitive FULL comparison and nothing else', () => {
    expect(sameWallet(FULL, FULL.toUpperCase().replace('0X', '0x'))).toBe(true);
    // two different full wallets with the same 6 + 4 short form are NOT the same wallet
    const a = `0xa1a1${'11'.repeat(16)}a1a1`;
    const b = `0xa1a1${'22'.repeat(16)}a1a1`;
    expect(shortAddr(a)).toBe(shortAddr(b));
    expect(sameWallet(a, b)).toBe(false);
    // a short match is never proof of ownership
    expect(sameWallet(FULL, '0xa1a1\u2026a1a1')).toBe(false);
    expect(sameWallet('0xa1a1\u2026a1a1', '0xa1a1\u2026a1a1')).toBe(false);
    expect(sameWallet(null, FULL)).toBe(false);
  });

  test('mayBeWallet only flags ambiguity: short-form agreement, or an exact full match', () => {
    expect(mayBeWallet(FULL, '0xa1a1\u2026a1a1')).toBe(true);
    expect(mayBeWallet(FULL, '0xb2b2\u2026b2b2')).toBe(false);
    const a = `0xa1a1${'11'.repeat(16)}a1a1`;
    const b = `0xa1a1${'22'.repeat(16)}a1a1`;
    expect(mayBeWallet(a, b)).toBe(false);
    expect(mayBeWallet(a, a.toUpperCase().replace('0X', '0x'))).toBe(true);
  });

  test('profileSegment prefers the opaque key and never returns a short address', () => {
    expect(profileSegment({ profileKey: 'c_0123456789abcdef01234567', walletAddress: '0xa1a1…a1a1' })).toBe('c_0123456789abcdef01234567');
    expect(profileSegment({ walletAddress: FULL })).toBe(FULL);
    expect(profileSegment({ walletAddress: '0xa1a1…a1a1' })).toBeNull();
    expect(profileSegment({ profileKey: null, walletAddress: '0xa1a1…a1a1' })).toBeNull();
    expect(profileSegment(null)).toBeNull();
  });

  test('defaultNodeName uses only the hex before an ellipsis', () => {
    expect(defaultNodeName(FULL)).toBe('WeatherNode-A1A1A1');
    expect(defaultNodeName('0xa1a1…a1a1')).toBe('WeatherNode-A1A1');
  });
});
