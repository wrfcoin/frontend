/**
 * @jest-environment jsdom
 */
// "My stations" (owner decision 2026-11-10): the signed-in wallet's stations from any browser, read from the
// backend; no location; the on-chain step in words; passkey sessions told it comes later.
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const getMyStations = jest.fn<() => Promise<unknown>>();
await jest.unstable_mockModule('../../../services/apiClient', () => ({
  stationRegistrationService: { getMyStations },
}));
const {
  default: MyStationsCard, MY_STATIONS_EMPTY, MY_STATIONS_UNAVAILABLE, MY_STATIONS_PASSKEY_LATER, MY_STATIONS_TRUNCATED,
} = await import('../MyStationsCard');

const OWNER = `0x${'ab'.repeat(20)}`;
const show = (owner: string | null = OWNER) => render(<MemoryRouter><MyStationsCard ownerAddress={owner} /></MemoryRouter>);

describe('MyStationsCard', () => {
  beforeEach(() => getMyStations.mockReset());
  afterEach(cleanup);

  it('without a signed-in owner it renders nothing and reads nothing', () => {
    const { container } = show(null);
    expect(container).toBeEmptyDOMElement();
    expect(getMyStations).not.toHaveBeenCalled();
  });

  it('lists every station with its name, freshness, last reading and on-chain step, linking by alias', async () => {
    getMyStations.mockResolvedValue({
      stations: [
        { alias: 'st_0123456789ab', name: 'Back garden', status: 'live', lastReadingAt: '2026-11-10T12:00:00.000Z', onChain: { state: 'earning' } },
        { alias: 'st_ba9876543210', name: 'Roof', status: 'registered', lastReadingAt: null, onChain: { state: 'waiting', waitingFor: 'batch' } },
      ],
      truncated: false,
      passkeyLater: false,
    });
    show();
    await waitFor(() => expect(screen.getAllByTestId('my-stations-row')).toHaveLength(2));
    expect(screen.getByText('Back garden').closest('a')).toHaveAttribute('href', '/weather/station/st_0123456789ab');
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText(/On chain, earning/)).toBeInTheDocument();
    expect(screen.getByText(/No reading yet · Waiting to join the chain/)).toBeInTheDocument();
    expect(screen.getByText('No readings yet')).toBeInTheDocument();
    expect(screen.queryByText(MY_STATIONS_TRUNCATED)).toBeNull();
  });

  it('no stations: says so', async () => {
    getMyStations.mockResolvedValue({ stations: [], truncated: false, passkeyLater: false });
    show();
    expect(await screen.findByText(MY_STATIONS_EMPTY)).toBeInTheDocument();
  });

  it('a passkey session before Phase 2: says passkey stations come later', async () => {
    getMyStations.mockResolvedValue({ stations: [], truncated: false, passkeyLater: true });
    show();
    expect(await screen.findByText(MY_STATIONS_PASSKEY_LATER)).toBeInTheDocument();
    expect(screen.queryByText(MY_STATIONS_EMPTY)).toBeNull();
  });

  it('a failed read says unavailable, and Refresh reads again', async () => {
    getMyStations.mockRejectedValueOnce(new Error('404'));
    show();
    expect(await screen.findByText(MY_STATIONS_UNAVAILABLE)).toBeInTheDocument();
    getMyStations.mockResolvedValue({ stations: [], truncated: true, passkeyLater: false });
    await act(async () => { fireEvent.click(screen.getByText('Refresh')); });
    expect(await screen.findByText(MY_STATIONS_EMPTY)).toBeInTheDocument();
    expect(screen.getByText(MY_STATIONS_TRUNCATED)).toBeInTheDocument();
    expect(getMyStations).toHaveBeenCalledTimes(2);
  });
});
