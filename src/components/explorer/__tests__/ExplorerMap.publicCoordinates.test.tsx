/** @jest-environment jsdom */
/**
 * Owner ruling 2026-10-01: no public page shows a position finer than 0.1
 * degree. The /explore map's station panel printed four decimals (padding the
 * grid value to look exact) and the free-text location. Public build: one
 * decimal, no location. Full studio keeps the precise text.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

const flags = { publicReadonly: true, fullStudio: false };
const features = new Proxy(flags, {
  get: (target, prop) => (prop in target ? target[prop as keyof typeof flags] : false),
});
await jest.unstable_mockModule('../../../config/features', () => ({
  default: features,
  FEATURES: features,
  isMvpMode: () => false,
}));

// Obviously fake coordinates and location.
const station = {
  id: 'st_fake',
  name: 'Fake station',
  latitude: 10.123456,
  longitude: -20.987654,
  location: '1 Fake Lane, Testville',
  status: 'live',
};

await jest.unstable_mockModule('../../../hooks/api/useWeatherQueries', () => ({
  useWeatherStationsWithCoords: () => ({ data: [station], isLoading: false }),
  useLatestObservations: () => ({ data: [], isLoading: false }),
}));

await jest.unstable_mockModule('react-leaflet', () => {
  const Element = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children);
  return {
    MapContainer: Element,
    TileLayer: Element,
    Popup: Element,
    useMap: () => ({ flyTo: () => undefined }),
    Marker: ({ children, eventHandlers }: {
      children?: React.ReactNode;
      eventHandlers?: { click?: () => void };
    }) =>
      React.createElement(
        'div',
        null,
        React.createElement('button', { 'data-testid': 'marker', onClick: () => eventHandlers?.click?.() }),
        children,
      ),
  };
});

const { default: ExplorerMap } = await import('../ExplorerMap');

function renderAndOpen(): string {
  render(
    <MemoryRouter initialEntries={['/explore?tab=map']}>
      <ExplorerMap />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByTestId('marker'));
  return document.body.textContent ?? '';
}

afterEach(() => {
  cleanup();
  flags.publicReadonly = true;
  flags.fullStudio = false;
});

describe('/explore station positions', () => {
  it('public build: one decimal (popup and panel), no free-text location', () => {
    const text = renderAndOpen();
    expect(text).toContain('10.1, -21.0');
    expect(text).not.toMatch(/-?\d+\.\d{2,}, -?\d+\.\d{2,}/);
    expect(text).not.toContain('Fake Lane');
  });

  it('full studio: the precise location text is kept', () => {
    flags.fullStudio = true;
    const text = renderAndOpen();
    expect(text).toContain('1 Fake Lane, Testville');
  });
});
