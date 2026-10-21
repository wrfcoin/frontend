import { jest } from '@jest/globals';
import { retryDynamicImport } from '../retryDynamicImport.js';

describe('retryDynamicImport', () => {
  it('returns module on first successful attempt', async () => {
    const importer = jest.fn().mockResolvedValue({ default: 'ok' });

    const result = await retryDynamicImport(importer, {
      retries: 2,
      retryDelayMs: 0,
    });

    expect(result).toEqual({ default: 'ok' });
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('retries until import succeeds', async () => {
    const importer = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue({ default: 'ok' });

    const result = await retryDynamicImport(importer, {
      retries: 3,
      retryDelayMs: 0,
    });

    expect(result).toEqual({ default: 'ok' });
    expect(importer).toHaveBeenCalledTimes(3);
  });

  it('throws after all retries fail', async () => {
    const importer = jest.fn().mockRejectedValue(new Error('permanent'));

    await expect(
      retryDynamicImport(importer, {
        retries: 2,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow('permanent');

    expect(importer).toHaveBeenCalledTimes(3);
  });

  it('normalizes negative retries to one attempt', async () => {
    const importer = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      retryDynamicImport(importer, {
        retries: -3,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow('always fails');

    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('throws for invalid importer input', async () => {
    await expect(
      retryDynamicImport(null, {
        retries: 1,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow('retryDynamicImport requires an importer function');
  });
});
