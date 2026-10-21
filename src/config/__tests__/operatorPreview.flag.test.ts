import { isOperatorPreviewEnabled } from '../contractSurfacePolicy';

describe('VITE_ENABLE_OPERATOR_PREVIEW (frontend#348)', () => {
  it('accepts only the exact string true', () => {
    expect(isOperatorPreviewEnabled('true')).toBe(true);
    for (const value of [undefined, null, '', 'false', 'TRUE', 'True', '1', 'yes', true, 1, ' true', 'true ']) {
      expect(isOperatorPreviewEnabled(value)).toBe(false);
    }
  });
});
