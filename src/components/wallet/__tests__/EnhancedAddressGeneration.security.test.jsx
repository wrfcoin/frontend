import {
  sanitizeAddressRecord,
  sanitizeAddressRecords,
} from '../addressRecordSanitizer.js';

describe('EnhancedAddressGeneration secret handling', () => {
  it('removes privateKey from a single address record', () => {
    const input = {
      id: 'addr_001',
      address: 'wrfabc',
      derivationPath: 'm/44\'/60\'/0\'/0/0',
      privateKey: '0xsupersecret',
      transactions: 3,
    };

    const sanitized = sanitizeAddressRecord(input);

    expect(sanitized).toEqual({
      id: 'addr_001',
      address: 'wrfabc',
      derivationPath: 'm/44\'/60\'/0\'/0/0',
      transactions: 3,
    });
    expect(sanitized.privateKey).toBeUndefined();
  });

  it('removes privateKey from legacy saved address arrays', () => {
    const input = [
      {
        id: 'addr_001',
        address: 'wrfabc',
        privateKey: '0xsecret1',
      },
      {
        id: 'addr_002',
        address: 'wrfdef',
        privateKey: '0xsecret2',
      },
    ];

    const sanitized = sanitizeAddressRecords(input);

    expect(sanitized).toEqual([
      { id: 'addr_001', address: 'wrfabc' },
      { id: 'addr_002', address: 'wrfdef' },
    ]);
  });

  it('drops malformed records from legacy arrays', () => {
    const input = [
      null,
      'bad-record',
      { id: 'addr_003', address: 'wrfghi', privateKey: '0xsecret3' },
    ];

    const sanitized = sanitizeAddressRecords(input);

    expect(sanitized).toEqual([{ id: 'addr_003', address: 'wrfghi' }]);
  });
});
