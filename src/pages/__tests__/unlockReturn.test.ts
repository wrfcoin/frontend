import { describe, it, expect } from '@jest/globals';
import { unlockReturnPath, UNLOCK_RETURN_STATE } from '../unlockReturn';

describe('unlockReturnPath', () => {
  it('accepts only the fixed return paths', () => {
    expect(unlockReturnPath(UNLOCK_RETURN_STATE.connectStation)).toBe('/connect-station');
    expect(unlockReturnPath(UNLOCK_RETURN_STATE.wallet)).toBe('/wallet');
    expect(unlockReturnPath(UNLOCK_RETURN_STATE.forecastNew)).toBe('/forecast/new');
    for (const bad of [null, undefined, 'x', {}, { returnTo: 'https://evil.example/' }, { returnTo: '//evil.example' }, { returnTo: '/connect-station/../admin' }, { returnTo: '/forecast/new?next=//evil.example' }, { returnTo: '/forecast' }]) {
      expect(unlockReturnPath(bad)).toBeNull();
    }
  });
});
