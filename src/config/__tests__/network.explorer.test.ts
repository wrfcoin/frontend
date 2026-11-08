import { describe, expect, it } from '@jest/globals';
import { EXPLORER_BASE_URL, explorerAddressUrl, explorerBaseFrom, explorerTxUrl } from '../network';

describe('VITE_EXPLORER_URL', () => {
  it('"self" points at this site\'s /explore pages', () => {
    expect(explorerBaseFrom('self')).toBe('/explore');
    expect(explorerBaseFrom(' SELF ')).toBe('/explore');
    expect(explorerBaseFrom('self/')).toBe('/explore');
  });

  it('an absolute URL stays an external explorer, trailing slashes trimmed', () => {
    expect(explorerBaseFrom('https://explorer.example/')).toBe('https://explorer.example');
  });

  it('unset or blank means no explorer: links stay off', () => {
    expect(explorerBaseFrom(undefined)).toBeNull();
    expect(explorerBaseFrom('')).toBeNull();
    expect(explorerBaseFrom('   ')).toBeNull();
    expect(explorerBaseFrom(42)).toBeNull();
  });

  it('the test build sets none, so the helpers render plain text', () => {
    expect(EXPLORER_BASE_URL).toBeNull();
    expect(explorerTxUrl('0x' + 'a'.repeat(64))).toBeNull();
    expect(explorerAddressUrl('0x' + 'b'.repeat(40))).toBeNull();
  });
});
