import { describe, expect, it } from '@jest/globals';
import { normalizeTxHash, parsePublicTransaction, txTypeLabel } from '../publicTransaction';

const HASH = `0x${'ab'.repeat(32)}`;

describe('publicTransaction', () => {
  it('normalizes a hash with or without 0x to lowercase 0x form', () => {
    expect(normalizeTxHash('AB'.repeat(32))).toBe(HASH);
    expect(normalizeTxHash(` ${HASH.toUpperCase().replace('0X', '0x')} `)).toBe(HASH);
    expect(normalizeTxHash('0x1234')).toBeNull();
    expect(normalizeTxHash(`${HASH}00`)).toBeNull();
  });

  it('parses an included answer and keeps only the published fields', () => {
    const parsed = parsePublicTransaction({
      success: true,
      data: { hash: HASH, status: 'included', blockHeight: 12, txType: 'ForecastCommit', timestamp: '2026-11-08T10:00:00.000Z', sender: '0x1' },
    }, HASH);
    expect(parsed).toEqual({ hash: HASH, status: 'included', blockHeight: 12, txType: 'ForecastCommit', timestamp: '2026-11-08T10:00:00.000Z' });
  });

  it('rejects an answer for another hash, an unknown status, or an included tx without a height', () => {
    expect(parsePublicTransaction({ data: { hash: `0x${'cd'.repeat(32)}`, status: 'unknown' } }, HASH)).toBeNull();
    expect(parsePublicTransaction({ data: { hash: HASH, status: 'odd' } }, HASH)).toBeNull();
    expect(parsePublicTransaction({ data: { hash: HASH, status: 'included', blockHeight: null } }, HASH)).toBeNull();
  });

  it('labels types in plain words', () => {
    expect(txTypeLabel('Transfer')).toBe('Send');
    expect(txTypeLabel('ContributionReveal')).toBe('Station reading reveal');
    expect(txTypeLabel('SlashingReport')).toBe('Slashing Report');
    expect(txTypeLabel(null)).toBe('Not reported');
  });
});
