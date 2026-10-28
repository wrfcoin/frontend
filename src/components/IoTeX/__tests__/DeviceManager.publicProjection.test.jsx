import React from 'react';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Synthetic fixture mirrors backend __tests__/routes/iotex-anonymous-projection-1220.test.ts:
// the public projection carries id/type, never deviceId/deviceType.
const PUBLIC_ROW = {
  id: 'dev-1',
  name: 'Sensor A',
  type: 'WEATHER_STATION',
  attestationStatus: 'VERIFIED',
  attestationType: 'SIGNATURE',
  lastSeen: '2026-09-20T00:00:00.000Z',
  latitude: 10.1,
  longitude: -20.9,
};

const mockGet = jest.fn();
const mockPost = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { get: mockGet, post: mockPost },
}));

const { default: DeviceManager, normalizeDevice, unwrapDeviceList } = await import('../DeviceManager');

describe('DeviceManager public projection (id/type)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it('normalizeDevice maps id/type and drops private fields', () => {
    const d = normalizeDevice({ ...PUBLIC_ROW, owner: '0xOwner', publicKey: 'PK', metadata: { s: 1 } });
    expect(d).toEqual({
      deviceId: 'dev-1',
      name: 'Sensor A',
      deviceType: 'WEATHER_STATION',
      attestationStatus: 'VERIFIED',
      lastSeen: '2026-09-20T00:00:00.000Z',
    });
    expect(JSON.stringify(d)).not.toMatch(/0xOwner|PK/);
  });

  it('unwraps the paginated envelope and tolerates a bare array or junk', () => {
    expect(unwrapDeviceList({ success: true, data: [PUBLIC_ROW], pagination: { total: 1 } })).toHaveLength(1);
    expect(unwrapDeviceList([PUBLIC_ROW])[0].deviceId).toBe('dev-1');
    expect(unwrapDeviceList({ success: false })).toEqual([]);
  });

  it('renders id and type in the table and passes the id to attestation/selection actions', async () => {
    mockGet.mockResolvedValue({ data: { success: true, data: [PUBLIC_ROW], pagination: { total: 1 } } });
    mockPost.mockResolvedValue({ data: { ok: true } });
    render(<DeviceManager />);

    expect(await screen.findByText('dev-1')).toBeInTheDocument();
    expect(screen.getByText('WEATHER_STATION')).toBeInTheDocument();
    expect(screen.getByText('1 device(s) registered')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Attest' }));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/api/iotex/devices/dev-1/attestation', { methods: ['tee'] }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit Data' }));
    expect(await screen.findAllByText('dev-1')).not.toHaveLength(0);
    expect(mockPost).not.toHaveBeenCalledWith(expect.stringContaining('undefined'), expect.anything());
  });
});
