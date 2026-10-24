/** @jest-environment jsdom */
/**
 * frontend#415 review: the full-build /explore map coloured every status it
 * did not name with the online green, so a registered, stale or unknown
 * station looked healthy. It now uses the shared presentation table:
 * Online green, Stale amber, Registered and unknown slate, and never green.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

const GREEN = '#22C55E';
const AMBER = '#F59E0B';
const SLATE = '#94A3B8';

type Station = { id: string; name: string; latitude: number; longitude: number; status: string };
let stations: Station[] = [];

await jest.unstable_mockModule('../../../hooks/api/useWeatherQueries', () => ({
  useWeatherStationsWithCoords: () => ({ data: stations, isLoading: false }),
  useLatestObservations: () => ({ data: [], isLoading: false }),
}));

await jest.unstable_mockModule('react-leaflet', () => {
  const Element = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children);
  return {
    MapContainer: Element,
    TileLayer: Element,
    Popup: () => null,
    useMap: () => ({ flyTo: () => undefined }),
    Marker: ({ icon, eventHandlers }: {
      icon: { options: { html: string } };
      eventHandlers?: { click?: () => void };
    }) =>
      React.createElement('button', {
        'data-testid': 'marker',
        'data-html': icon.options.html,
        onClick: () => eventHandlers?.click?.(),
      }),
  };
});

const { default: ExplorerMap } = await import('../ExplorerMap');

function markerFill(index: number): string | undefined {
  const html = screen.getAllByTestId('marker')[index].getAttribute('data-html') ?? '';
  return html.match(/fill="(#[0-9A-Fa-f]{6})"/)?.[1];
}

function renderMap(rows: Station[]) {
  stations = rows;
  render(
    <MemoryRouter initialEntries={['/explore?tab=map']}>
      <ExplorerMap />
    </MemoryRouter>,
  );
}

const at = (id: string, status: string): Station => ({
  id, name: `Station ${id}`, latitude: 46.8, longitude: -92.1, status,
});

afterEach(() => cleanup());

describe('/explore map station status', () => {
  it('colours live green, stale amber, registered and unknown slate', () => {
    renderMap([at('a', 'live'), at('b', 'stale'), at('c', 'registered'), at('d', 'unknown'), at('e', 'bogus')]);
    expect(markerFill(0)).toBe(GREEN);
    expect(markerFill(1)).toBe(AMBER);
    expect(markerFill(2)).toBe(SLATE);
    expect(markerFill(3)).toBe(SLATE);
    expect(markerFill(4)).toBe(SLATE);
  });

  it.each([
    ['live', 'Online'],
    ['stale', 'Stale'],
    ['registered', 'Registered (no recent data)'],
    ['unknown', 'Status unknown'],
  ])('the detail panel labels %s as "%s"', (status, label) => {
    renderMap([at('x', status)]);
    fireEvent.click(screen.getByTestId('marker'));
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.queryByText('Offline')).toBeNull();
  });
});
