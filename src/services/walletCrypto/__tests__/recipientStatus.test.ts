import { expect, it } from '@jest/globals';
import { recipientStatus, assertOrdinarySendRecipient } from '../recipientStatus';

const legacy = '0x465230af3383c16d024c5f4b87ed2d1b595be148';
const current = '0x1747c0169753965c854230c59c876be0f9b5a275';

it('blocks the positively identified legacy address, independent of casing or surrounding whitespace', () => {
  for (const address of [legacy, legacy.toUpperCase(), ` ${legacy} `, `wrf${legacy.slice(2)}`]) {
    expect(recipientStatus(address)).toBe('known-legacy-receive-only');
    expect(() => assertOrdinarySendRecipient(address)).toThrow('Ordinary Send is blocked');
  }
});
it.each([current, '0x' + '2'.repeat(40), '0x465230af3383c16d024c5f4b87ed2d1b595be149'])('%s remains unknown, never certified safe', address => {
  expect(recipientStatus(address)).toBe('unknown');
  expect(() => assertOrdinarySendRecipient(address)).not.toThrow();
});
