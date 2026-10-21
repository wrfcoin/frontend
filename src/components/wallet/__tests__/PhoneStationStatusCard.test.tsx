/**
 * @jest-environment jsdom
 */
// W28: the web phone-station status says what the WRFCoin app says, shows no location, and never turns an
// unavailable status into an activation claim.
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const getMobileStationStatus = jest.fn<() => Promise<unknown>>();
const getStationOwnership = jest.fn<(id: string) => Promise<unknown>>();
await jest.unstable_mockModule('../../../services/apiClient', () => ({
  stationRegistrationService: { getMobileStationStatus },
  weatherService: { getStationOwnership },
}));

const {
  default: PhoneStationStatusCard, AWAITING_ACTIVATION_MESSAGE, ACTIVE_MESSAGE, NOT_REGISTERED_MESSAGE, UNAVAILABLE_MESSAGE,
} = await import('../PhoneStationStatusCard');

const OWNER = `0x${'ab'.repeat(20)}`;
const show = () => render(<PhoneStationStatusCard ownerAddress={OWNER} />);

describe('PhoneStationStatusCard (W28)', () => {
  beforeEach(() => {
    getMobileStationStatus.mockReset();
    getStationOwnership.mockReset();
    getStationOwnership.mockRejectedValue(new Error('ownership not under test'));
  });
  afterEach(() => cleanup());

  it('without a signed-in owner it renders nothing and reads nothing', () => {
    const { container } = render(<PhoneStationStatusCard ownerAddress={null} />);
    expect(container).toBeEmptyDOMElement();
    expect(getMobileStationStatus).not.toHaveBeenCalled();
  });

  it.each(['db_only', 'submitted'])('%s: the app\'s "awaiting activation" text, the station id, no location', async (phase) => {
    getMobileStationStatus.mockResolvedValue({ stationId: 'mob-0123abcd', phase, updatedAt: '2026-10-02T00:00:00.000Z' });
    show();
    expect(await screen.findByText(AWAITING_ACTIVATION_MESSAGE)).toBeInTheDocument();
    expect(AWAITING_ACTIVATION_MESSAGE).toBe(
      'Station awaiting activation. Rewards start once the network activates your station.');
    expect(screen.getByText('mob-0123abcd')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/latitude|longitude|°|cell/i);
    expect(screen.queryByText(ACTIVE_MESSAGE)).toBeNull();
  });

  it('shows the read-only ownership card for the phone station', async () => {
    getMobileStationStatus.mockResolvedValue({ stationId: 'mob-0123abcd', phase: 'on_chain', updatedAt: null });
    show();
    expect(await screen.findByTestId('station-ownership')).toBeInTheDocument();
    expect(getStationOwnership).toHaveBeenCalledWith('mob-0123abcd');
  });

  it('on_chain: active', async () => {
    getMobileStationStatus.mockResolvedValue({ stationId: 'mob-0123abcd', phase: 'on_chain', updatedAt: null });
    show();
    expect(await screen.findByText(ACTIVE_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(AWAITING_ACTIVATION_MESSAGE)).toBeNull();
  });

  it('not registered: says how to register in the app', async () => {
    getMobileStationStatus.mockResolvedValue(null);
    show();
    expect(await screen.findByText(NOT_REGISTERED_MESSAGE)).toBeInTheDocument();
  });

  it('unavailable: claims neither activation nor rewards; Refresh reads again', async () => {
    getMobileStationStatus.mockRejectedValueOnce(new Error('Not found'));
    show();
    expect(await screen.findByText(UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(ACTIVE_MESSAGE)).toBeNull();
    expect(screen.queryByText(AWAITING_ACTIVATION_MESSAGE)).toBeNull();
    getMobileStationStatus.mockResolvedValueOnce({ stationId: 'mob-0123abcd', phase: 'on_chain', updatedAt: null });
    fireEvent.click(screen.getByText('Refresh station status'));
    await waitFor(() => expect(screen.getByText(ACTIVE_MESSAGE)).toBeInTheDocument());
    expect(getMobileStationStatus).toHaveBeenCalledTimes(2);
  });

  it('a late reply for the previous owner never overwrites the current owner\'s status', async () => {
    let resolveFirst: (v: unknown) => void = () => {};
    getMobileStationStatus.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    getMobileStationStatus.mockResolvedValueOnce(null);
    const view = render(<PhoneStationStatusCard ownerAddress={OWNER} />);
    view.rerender(<PhoneStationStatusCard ownerAddress={`0x${'cd'.repeat(20)}`} />);
    expect(await screen.findByText(NOT_REGISTERED_MESSAGE)).toBeInTheDocument();
    await act(async () => { resolveFirst({ stationId: 'mob-previous-owner', phase: 'on_chain', updatedAt: null }); });
    expect(screen.queryByText('mob-previous-owner')).toBeNull();
    expect(screen.queryByText(ACTIVE_MESSAGE)).toBeNull();
    expect(screen.getByText(NOT_REGISTERED_MESSAGE)).toBeInTheDocument();
  });

  it('a reply that lands after the owner signs out is discarded', async () => {
    let resolveFirst: (v: unknown) => void = () => {};
    getMobileStationStatus.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    const view = render(<PhoneStationStatusCard ownerAddress={OWNER} />);
    view.rerender(<PhoneStationStatusCard ownerAddress={null} />);
    await act(async () => { resolveFirst({ stationId: 'mob-previous-owner', phase: 'on_chain', updatedAt: null }); });
    expect(view.container).toBeEmptyDOMElement();
    view.rerender(<PhoneStationStatusCard ownerAddress={OWNER} />);
    expect(screen.queryByText('mob-previous-owner')).toBeNull();
  });
});
