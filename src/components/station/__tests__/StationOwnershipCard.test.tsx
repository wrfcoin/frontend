/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';

const getStationOwnership = jest.fn<(id: string) => Promise<unknown>>();
await jest.unstable_mockModule('../../../services/apiClient', () => ({ weatherService: { getStationOwnership } }));

const { default: StationOwnershipCard, OWNERSHIP_NOT_REGISTERED_MESSAGE, OWNERSHIP_UNAVAILABLE_MESSAGE } =
  await import('../StationOwnershipCard');
const { default: ApiError } = await import('../../../utils/apiError');
const { normalizeStationOwnership } = await import('../../../utils/stationOwnership');

const body = (over: Record<string, unknown> = {}) => ({
  success: true,
  stationAlias: 'st_406339c8ab53',
  owner: '0xabcd…ef01',
  ownerNonce: 7,
  frozen: null,
  ownerDeactivated: false,
  rewardsSuspended: false,
  pendingRecovery: null,
  observedAtHeight: 1000,
  settledHeight: 990,
  ...over,
});
const show = () => render(<StationOwnershipCard stationId="st_406339c8ab53" />);

describe('StationOwnershipCard', () => {
  beforeEach(() => getStationOwnership.mockReset());
  afterEach(() => cleanup());

  it('shows owner, active status and nonce', async () => {
    getStationOwnership.mockResolvedValue(normalizeStationOwnership(body()));
    show();
    expect(await screen.findByTestId('ownership-status')).toHaveTextContent('Active');
    expect(screen.getByText('0xabcd…ef01')).toBeInTheDocument();
    expect(screen.getByText('Owner nonce: 7')).toBeInTheDocument();
    expect(screen.getByText('No ownership recovery is pending.')).toBeInTheDocument();
    expect(getStationOwnership).toHaveBeenCalledWith('st_406339c8ab53');
  });

  it('shows frozen, and deactivated wins over frozen', async () => {
    getStationOwnership.mockResolvedValue(normalizeStationOwnership(body({ frozen: { sinceHeight: 900 } })));
    show();
    expect(await screen.findByTestId('ownership-status')).toHaveTextContent('Frozen');
    cleanup();
    getStationOwnership.mockResolvedValue(normalizeStationOwnership(body({ frozen: { sinceHeight: 900 }, ownerDeactivated: true })));
    show();
    expect(await screen.findByText('Deactivated')).toBeInTheDocument();
  });

  it('shows a pending recovery with its notice window', async () => {
    getStationOwnership.mockResolvedValue(normalizeStationOwnership(body({
      pendingRecovery: { fromOwner: '0x1111…1111', toOwner: '0x2222…2222', recoveryNonce: 1, filedAtHeight: 950, executableAtHeight: 1050, noticeBlocks: 100 },
    })));
    show();
    const pending = await screen.findByTestId('ownership-pending-recovery');
    expect(pending).toHaveTextContent('notice window 100 blocks');
    expect(pending).toHaveTextContent('executable at block 1050, 50 blocks remaining');
  });

  it('404 says not registered; other failures say unavailable', async () => {
    getStationOwnership.mockRejectedValue(new ApiError('nope', 404));
    show();
    expect(await screen.findByText(OWNERSHIP_NOT_REGISTERED_MESSAGE)).toBeInTheDocument();
    cleanup();
    getStationOwnership.mockRejectedValue(new ApiError('boom', 503));
    show();
    expect(await screen.findByText(OWNERSHIP_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByTestId('ownership-status')).toBeNull();
  });

  it('refuses a body missing frozen rather than reading it as not frozen', () => {
    const rest: Record<string, unknown> = body();
    delete rest.frozen;
    expect(() => normalizeStationOwnership(rest)).toThrow();
    expect(() => normalizeStationOwnership([])).toThrow();
  });
});
