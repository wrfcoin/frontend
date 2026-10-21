import { jest } from '@jest/globals';
import { lazyImportWithRetry } from '../lazyImportWithRetry.js';

describe('lazyImportWithRetry', () => {
  it('returns imported module when first attempt succeeds', async () => {
    const importer = jest.fn().mockResolvedValue({ default: 'ModuleA' });

    const result = await lazyImportWithRetry(importer, {
      retries: 2,
      retryDelayMs: 0,
    });

    expect(result).toEqual({ default: 'ModuleA' });
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('retries failed imports and succeeds on a later attempt', async () => {
    const importer = jest
      .fn()
      .mockRejectedValueOnce(new Error('network blip'))
      .mockRejectedValueOnce(new Error('transient failure'))
      .mockResolvedValue({ default: 'ModuleB' });

    const result = await lazyImportWithRetry(importer, {
      retries: 3,
      retryDelayMs: 0,
    });

    expect(result).toEqual({ default: 'ModuleB' });
    expect(importer).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting retry attempts', async () => {
    const importer = jest
      .fn()
      .mockRejectedValue(new Error('permanent import failure'));

    await expect(
      lazyImportWithRetry(importer, {
        retries: 2,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow('permanent import failure');

    expect(importer).toHaveBeenCalledTimes(3);
  });

  it('normalizes negative retries to a single attempt', async () => {
    const importer = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      lazyImportWithRetry(importer, {
        retries: -5,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow('always fails');

    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('throws for invalid importer input', async () => {
    await expect(
      lazyImportWithRetry(null, {
        retries: 1,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow('lazyImportWithRetry requires an importer function');
  });
});
