/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const get = jest.fn<(path: string) => Promise<unknown>>(async () => { throw new Error('404: fleet unavailable'); });
jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get } }));
// jsdom has no geographic canvas; preserve the real fleet view and its API.
const mapElement = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
jest.unstable_mockModule('react-leaflet', () => ({ MapContainer: mapElement, TileLayer: mapElement, CircleMarker: mapElement, Popup: mapElement }));
const { default: FleetDashboard } = await import('../FleetDashboard');
beforeEach(() => { flags.demoSurfaces = false; get.mockReset(); get.mockImplementation(async () => { throw new Error('404: fleet unavailable'); }); });
afterEach(() => { cleanup(); });
it('an unmounted fleet cannot render zero live stations or earning summaries', async () => {
  render(<MemoryRouter><FleetDashboard /></MemoryRouter>);
  expect(await screen.findByText('Fleet management is unavailable')).toBeInTheDocument();
  expect(screen.queryByText(/0 LIVE/)).not.toBeInTheDocument();
  expect(screen.queryByText('MY STATIONS')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/fleet/stations');
});

it('does not label a genuine successful fleet response as sample data', async () => {
  flags.demoSurfaces = true;
  get.mockImplementation(async () => []);
  render(<MemoryRouter><FleetDashboard /></MemoryRouter>);
  expect(await screen.findByText('MY STATIONS')).toBeInTheDocument();
  expect(screen.queryByText(/Sample data/i)).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/fleet/stations');
});
it('does not show zero summaries while a required fleet read is pending', () => {
  flags.demoSurfaces = true;
  get.mockImplementation(() => new Promise(() => {}));
  render(<MemoryRouter><FleetDashboard /></MemoryRouter>);
  expect(screen.queryByText(/0 LIVE/)).not.toBeInTheDocument();
  expect(screen.queryByText('MY STATIONS')).not.toBeInTheDocument();
});
it('rejects malformed successful fleet payloads instead of claiming an empty fleet', async () => {
  flags.demoSurfaces = true;
  get.mockImplementation(async () => null);
  render(<MemoryRouter><FleetDashboard /></MemoryRouter>);
  expect(await screen.findByText('Fleet management is unavailable')).toBeInTheDocument();
  expect(screen.queryByText(/Sample data/i)).not.toBeInTheDocument();
  expect(screen.queryByText('MY STATIONS')).not.toBeInTheDocument();
});
