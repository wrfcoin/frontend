import { describe, expect, it } from '@jest/globals';
import { resolveServiceBaseUrls } from '../runtime';

describe('resolveServiceBaseUrls', () => {
  it('defaults the typed API client to relative /api for testnet builds', () => {
    expect(resolveServiceBaseUrls({})).toMatchObject({
      api: '/api',
      weather: '/api',
      earnings: '/api',
      governance: '/api',
      wallet: '/api',
      compute: '/api',
      validator: '/api',
    });
  });
});
