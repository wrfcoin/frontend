import { isPublicReadonlyEnabled } from '../contractSurfacePolicy';

describe('VITE_PUBLIC_READONLY_PATHS', () => {
  it('accepts only the exact string true', () => {
    expect(isPublicReadonlyEnabled('true')).toBe(true);
    for (const value of [undefined, '', 'TRUE', '1', true, ' true', 'true ']) {
      expect(isPublicReadonlyEnabled(value)).toBe(false);
    }
  });
});
