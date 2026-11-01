/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import StationCalibrationCard, { CalibrationBadge } from '../StationCalibrationCard';
import { normalizeStationCalibration } from '../../../utils/stationCalibration';

const ALIAS = 'st_7d29a4c1e0b8';
const body = (over: Record<string, unknown> = {}, certOver: Record<string, unknown> = {}) => ({
  stationAlias: ALIAS,
  status: 'calibrated',
  certificate: {
    cid: 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy',
    artifactId: 'cal-1',
    status: 'calibrated',
    issuer: { issuerId: 'WRFCoin owner (testnet)', trustRootId: 'wrfcoin-owner-testnet' },
    issuedAt: '2026-11-01T11:59:00.000Z',
    expiresAt: '2027-11-01T11:59:00.000Z',
    ownerAddress: '0x' + 'ab'.repeat(20),
    calibration: { sensor: 'Davis 6152 temp/RH', method: 'two-point salt test', reference: 'NIST-traceable thermometer' },
    revocation: null,
    artifact: { schemaVersion: 'wrf-calibration-attestation/v1', artifactId: 'cal-1', signature: { value: 'aa' } },
    ...certOver,
  },
  trustRoots: [{ rootId: 'wrfcoin-owner-testnet', subject: 'WRFCoin owner (testnet)', publicKeyHex: 'ab'.repeat(32) }],
  checkedAt: '2026-11-01T12:00:00.000Z',
  ...over,
});

describe('StationCalibrationCard', () => {
  afterEach(() => cleanup());

  it('shows a calibrated station: signer, validity, sensor details, certificate id and the signed JSON download', () => {
    render(<StationCalibrationCard view={normalizeStationCalibration(body())} unavailable={false} />);
    expect(screen.getByTestId('station-calibration-status')).toHaveTextContent('Calibrated');
    expect(screen.getByText('WRFCoin owner (testnet)')).toBeInTheDocument();
    expect(screen.getByText(/Nov 1, 2026 to Nov 1, 2027/)).toBeInTheDocument();
    expect(screen.getByText('Davis 6152 temp/RH')).toBeInTheDocument();
    expect(screen.getByText('NIST-traceable thermometer')).toBeInTheDocument();
    expect(screen.getByText('0xabab…abab')).toBeInTheDocument();
    expect(screen.getByText('bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy')).toBeInTheDocument();
    const link = screen.getByTestId('station-calibration-download');
    expect(link).toHaveAttribute('download', 'calibration-cal-1.json');
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain('"artifactId": "cal-1"');
  });

  it('shows a revoked certificate with the reason', () => {
    render(<StationCalibrationCard view={normalizeStationCalibration(body({ status: 'revoked' }, { status: 'revoked', revocation: { reason: 'sensor_replaced', revokedAt: '2026-12-01T00:00:00.000Z' } }))} unavailable={false} />);
    expect(screen.getByTestId('station-calibration-status')).toHaveTextContent('Calibration revoked');
    expect(screen.getByText(/the sensor was replaced/)).toBeInTheDocument();
  });

  it('shows expired and never-calibrated plainly', () => {
    render(<StationCalibrationCard view={normalizeStationCalibration(body({ status: 'expired' }, { status: 'expired' }))} unavailable={false} />);
    expect(screen.getByTestId('station-calibration-status')).toHaveTextContent('Calibration expired');
    cleanup();
    render(<StationCalibrationCard view={normalizeStationCalibration(body({ status: 'none', certificate: null }))} unavailable={false} />);
    expect(screen.getByTestId('station-calibration-status')).toHaveTextContent('Not calibrated');
    expect(screen.getByText(/No calibration certificate has been issued/)).toBeInTheDocument();
    expect(screen.queryByTestId('station-calibration-download')).not.toBeInTheDocument();
  });

  it('says when the status cannot be read, without implying "not calibrated"', () => {
    render(<StationCalibrationCard view={undefined} unavailable />);
    expect(screen.getByRole('status')).toHaveTextContent('Calibration status is not available right now.');
    expect(screen.queryByText('Not calibrated')).not.toBeInTheDocument();
  });
});

describe('CalibrationBadge', () => {
  afterEach(() => cleanup());

  it('shows the status chip next to the station name, and nothing for none or while loading', () => {
    render(<CalibrationBadge view={normalizeStationCalibration(body())} />);
    expect(screen.getByTestId('station-calibration-badge')).toHaveTextContent('Calibrated');
    cleanup();
    render(<CalibrationBadge view={normalizeStationCalibration(body({ status: 'none', certificate: null }))} />);
    expect(screen.queryByTestId('station-calibration-badge')).not.toBeInTheDocument();
    cleanup();
    render(<CalibrationBadge view={undefined} />);
    expect(screen.queryByTestId('station-calibration-badge')).not.toBeInTheDocument();
  });
});
