/** @jest-environment jsdom */
/**
 * frontend#560: at 390 px the legend and layer panels covered almost the
 * whole weather map. Under 768 px they start collapsed and open on tap; at
 * 768 px and above the long-standing open default is unchanged.
 */
import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import LayerControls from '../LayerControls';
import type { LayerOpacity, LayerState } from '../LayerControls';
import MapLegend from '../MapLegend';
import { COMPACT_MAP_QUERY, useCompactMapLayout } from '../useCompactMapLayout';

const LAYERS: LayerState = {
  stations: true,
  wind: true,
  temperature: true,
  precipitation: false,
  pressure: false,
  stationNames: false,
  scarcity: false,
};
const OPACITY: LayerOpacity = { wind: 0.7, temperature: 0.5, precipitation: 0.5, pressure: 0.4 };

type Listener = (event: { matches: boolean }) => void;

/** Installs a matchMedia stub for the compact query and returns a width setter. */
function installMatchMedia(initialWidth: number) {
  let width = initialWidth;
  const listeners = new Set<Listener>();
  const matches = () => width <= 767;
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() {
      return query === COMPACT_MAP_QUERY ? matches() : false;
    },
    onchange: null,
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
    addListener: (listener: Listener) => listeners.add(listener),
    removeListener: (listener: Listener) => listeners.delete(listener),
    dispatchEvent: () => true,
  })) as unknown as typeof window.matchMedia;
  return {
    resize(next: number) {
      width = next;
      listeners.forEach(listener => listener({ matches: matches() }));
    },
    restore() {
      window.matchMedia = original;
    },
  };
}

function Probe() {
  const compact = useCompactMapLayout();
  return <span data-testid="probe">{compact ? 'compact' : 'desktop'}</span>;
}

afterEach(cleanup);

describe('useCompactMapLayout', () => {
  it('is compact under 768 px, desktop at 768 px, and follows viewport changes', () => {
    const media = installMatchMedia(390);
    try {
      render(<Probe />);
      expect(screen.getByTestId('probe')).toHaveTextContent('compact');
      act(() => media.resize(768));
      expect(screen.getByTestId('probe')).toHaveTextContent('desktop');
      act(() => media.resize(767));
      expect(screen.getByTestId('probe')).toHaveTextContent('compact');
    } finally {
      media.restore();
    }
  });

  it('falls back to the desktop layout when matchMedia is unavailable', () => {
    const original = window.matchMedia;
    // @ts-expect-error jsdom has no matchMedia; make the absence explicit.
    delete window.matchMedia;
    try {
      render(<Probe />);
      expect(screen.getByTestId('probe')).toHaveTextContent('desktop');
    } finally {
      window.matchMedia = original;
    }
  });
});

describe('LayerControls', () => {
  const renderPanel = (props: Partial<React.ComponentProps<typeof LayerControls>> = {}) =>
    render(
      <LayerControls
        layers={LAYERS}
        opacity={OPACITY}
        onToggleLayer={() => undefined}
        onOpacityChange={() => undefined}
        {...props}
      />,
    );

  it('keeps the open desktop default', () => {
    renderPanel();
    expect(screen.getByTestId('map-layers-panel')).toHaveAttribute('data-collapsed', 'false');
    expect(screen.getByText('Data Layers')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide map layers' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('on phones a collapsed panel renders nothing (the toolbar carries the chip) and an open one is a sheet', () => {
    const onToggle = jest.fn();
    const view = renderPanel({ compact: true, collapsed: true, onToggle });
    expect(screen.queryByTestId('map-layers-panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Data Layers')).not.toBeInTheDocument();
    view.rerender(
      <LayerControls layers={LAYERS} opacity={OPACITY} onToggleLayer={() => undefined} onOpacityChange={() => undefined} compact collapsed={false} onToggle={onToggle} />,
    );
    const panel = screen.getByTestId('map-layers-panel');
    expect(panel).toHaveAttribute('data-collapsed', 'false');
    expect(panel).toHaveStyle({ left: '12px', right: '12px' });
    expect(screen.getByText('Data Layers')).toBeInTheDocument();
    expect(screen.getAllByRole('switch')).toHaveLength(7);
    fireEvent.click(screen.getByRole('button', { name: 'Hide map layers' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('re-applies the default when the breakpoint changes (uncontrolled)', () => {
    const view = renderPanel({ defaultCollapsed: false });
    expect(screen.getByTestId('map-layers-panel')).toHaveAttribute('data-collapsed', 'false');
    view.rerender(
      <LayerControls layers={LAYERS} opacity={OPACITY} onToggleLayer={() => undefined} onOpacityChange={() => undefined} defaultCollapsed />,
    );
    expect(screen.getByTestId('map-layers-panel')).toHaveAttribute('data-collapsed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Show map layers' }));
    expect(screen.getByTestId('map-layers-panel')).toHaveAttribute('data-collapsed', 'false');
  });
});

describe('MapLegend', () => {
  it('keeps the open desktop default', () => {
    render(<MapLegend activeLayers={['stations', 'wind', 'temperature']} />);
    expect(screen.getByTestId('map-legend-panel')).toHaveAttribute('data-collapsed', 'false');
    expect(screen.getByText('Station Quality')).toBeInTheDocument();
    expect(screen.getByText('Wind Speed')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });

  it('on phones a collapsed legend renders nothing and an open one is a sheet across the map top', () => {
    const onToggle = jest.fn();
    const view = render(<MapLegend activeLayers={['stations', 'wind', 'temperature']} compact collapsed onToggle={onToggle} />);
    expect(screen.queryByTestId('map-legend-panel')).not.toBeInTheDocument();
    view.rerender(<MapLegend activeLayers={['stations', 'wind', 'temperature']} compact collapsed={false} onToggle={onToggle} />);
    const panel = screen.getByTestId('map-legend-panel');
    expect(panel).toHaveAttribute('data-collapsed', 'false');
    expect(panel).toHaveStyle({ top: '12px', left: '12px', right: '12px' });
    expect(screen.getByText('Station Quality')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide map legend' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when no legend-bearing layer is active', () => {
    render(<MapLegend activeLayers={['stationNames']} defaultCollapsed compact />);
    expect(screen.queryByTestId('map-legend-panel')).not.toBeInTheDocument();
  });
});
