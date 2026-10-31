import { normalizeStationCalibration } from '../stationCalibration';

const ALIAS = 'st_7d29a4c1e0b8';
const calibratedBody = (over: Record<string, unknown> = {}, certOver: Record<string, unknown> = {}) => ({
  success: true,
  stationAlias: ALIAS,
  status: 'calibrated',
  certificate: {
    cid: 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy',
    artifactId: 'cal-1',
    status: 'calibrated',
    reasonCodes: ['CAL_OK'],
    issuer: { issuerId: 'WRFCoin owner (testnet)', trustRootId: 'wrfcoin-owner-testnet' },
    issuedAt: '2026-11-01T11:59:00.000Z',
    expiresAt: '2027-11-01T11:59:00.000Z',
    ownerAddress: '0x' + 'ab'.repeat(20),
    calibration: { sensor: 'Davis 6152 temp/RH', method: 'two-point salt test' },
    revocation: null,
    artifact: { schemaVersion: 'wrf-calibration-attestation/v1', artifactId: 'cal-1' },
    ...certOver,
  },
  history: [],
  trustRoots: [{ rootId: 'wrfcoin-owner-testnet', subject: 'WRFCoin owner (testnet)', publicKeyHex: 'ab'.repeat(32), fingerprintSha256: 'cd'.repeat(32) }],
  checkedAt: '2026-11-01T12:00:00.000Z',
  ...over,
});

describe('normalizeStationCalibration', () => {
  it('reads a calibrated station with its certificate details and signed JSON', () => {
    const view = normalizeStationCalibration(calibratedBody());
    expect(view.status).toBe('calibrated');
    expect(view.certificate).toMatchObject({ issuerId: 'WRFCoin owner (testnet)', sensor: 'Davis 6152 temp/RH', method: 'two-point salt test', reference: null, revocation: null });
    expect(view.signedCertificate).toMatchObject({ artifactId: 'cal-1' });
    expect(view.trustRoots).toEqual([{ rootId: 'wrfcoin-owner-testnet', subject: 'WRFCoin owner (testnet)', publicKeyHex: 'ab'.repeat(32) }]);
  });

  it('reads none with no certificate', () => {
    const view = normalizeStationCalibration(calibratedBody({ status: 'none', certificate: null }));
    expect(view).toMatchObject({ status: 'none', certificate: null, signedCertificate: null });
  });

  it('reads a revocation', () => {
    const view = normalizeStationCalibration(calibratedBody({ status: 'revoked' }, { status: 'revoked', revocation: { reason: 'sensor_replaced', revokedAt: '2026-12-01T00:00:00.000Z' } }));
    expect(view.certificate?.revocation).toEqual({ reason: 'sensor_replaced', revokedAt: '2026-12-01T00:00:00.000Z' });
  });

  it.each([
    ['an unknown status', calibratedBody({ status: 'maybe' })],
    ['a certificate whose status disagrees with the station status', calibratedBody({ status: 'calibrated' }, { status: 'expired' })],
    ['a calibrated station without a certificate', calibratedBody({ certificate: null })],
    ['none with a certificate attached', calibratedBody({ status: 'none' })],
    ['a missing expiry', calibratedBody({}, { expiresAt: 'soon' })],
    ['missing trust roots', calibratedBody({ trustRoots: undefined })],
    ['a non-object', 'calibrated'],
  ])('refuses %s (never shown as calibrated)', (_label, body) => {
    expect(() => normalizeStationCalibration(body)).toThrow('unexpected shape');
  });
});
