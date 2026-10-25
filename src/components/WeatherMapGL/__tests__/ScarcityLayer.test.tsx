/** @jest-environment jsdom */
/**
 * core4#28 / ADR 2026-10-23-3563 (owner answer A1): the public map's scarcity layer draws the
 * cells the chain counts, shaded by the bonus the chain pays, and the legend states that rule
 * from the same response. An unreadable response draws nothing and says it is unavailable.
 */
import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

const rectangles: { bounds: [[number, number], [number, number]]; pathOptions: { fillColor?: string }; testid?: string }[] = [];
await jest.unstable_mockModule('react-leaflet', () => ({
  Rectangle: (props: { bounds: [[number, number], [number, number]]; pathOptions: { fillColor?: string }; children?: React.ReactNode }) => {
    rectangles.push({ bounds: props.bounds, pathOptions: props.pathOptions });
    return React.createElement('div', { 'data-testid': 'scarcity-rect' }, props.children);
  },
  Tooltip: ({ children }: { children?: React.ReactNode }) => React.createElement('span', null, children),
}));

const { default: ScarcityCellsLayer } = await import('../ScarcityCellsLayer');
const { default: MapLegend } = await import('../MapLegend');
const { default: LayerControls } = await import('../LayerControls');
import type { ScarcityRuleState } from '../../../hooks/useScarcityRule';

const READY: ScarcityRuleState = {
  state: 'ready',
  observedAtHeight: 4242,
  rule: { gridKm: 222, cellSizeDegrees: 2, minStationDensity: 3, desertBonusMultiplier: 1.5, baselineMultiplier: 1, activationHeight: 0, active: true },
  zones: [
    { lat: 47, lng: -93, rewardMultiplier: 1.5, stationCount: 2 },
    { lat: 45, lng: -93, rewardMultiplier: 1, stationCount: 5 },
  ],
};

afterEach(() => { cleanup(); rectangles.length = 0; });

describe('ScarcityCellsLayer', () => {
  it('draws one rectangle per chain cell at its true size, coloured by the paid multiplier', () => {
    render(<ScarcityCellsLayer scarcity={READY} />);
    expect(screen.getAllByTestId('scarcity-rect')).toHaveLength(2);
    expect(rectangles[0].bounds).toEqual([[46, -94], [48, -92]]);
    expect(rectangles[1].bounds).toEqual([[44, -94], [46, -92]]);
    expect(rectangles[0].pathOptions.fillColor).not.toBe(rectangles[1].pathOptions.fillColor);
  });

  it.each([{ state: 'loading' }, { state: 'unavailable' }] as ScarcityRuleState[])('draws nothing while %p', scarcity => {
    render(<ScarcityCellsLayer scarcity={scarcity} />);
    expect(screen.queryAllByTestId('scarcity-rect')).toHaveLength(0);
  });
});

describe('MapLegend scarcity section', () => {
  it('states the served rule', () => {
    render(<MapLegend activeLayers={['scarcity']} scarcity={READY} />);
    const legend = screen.getByTestId('map-legend-panel');
    expect(legend.textContent).toMatch(/Paid scarcity bonus/i);
    expect(legend.textContent).toMatch(/×1\.5/);
    expect(legend.textContent).toMatch(/fewer than 3 active registered stations/i);
  });

  it('says unavailable, without a rule, when the response could not be read', () => {
    render(<MapLegend activeLayers={['scarcity']} scarcity={{ state: 'unavailable' }} />);
    const legend = screen.getByTestId('map-legend-panel');
    expect(legend.textContent).toMatch(/unavailable/i);
    expect(legend.textContent).not.toMatch(/×1\.5/);
  });
});

describe('LayerControls', () => {
  it('has a Paid scarcity bonus switch that toggles the scarcity layer', () => {
    const onToggleLayer = jest.fn();
    render(
      <LayerControls
        layers={{ stations: true, wind: false, temperature: false, precipitation: false, pressure: false, stationNames: false, scarcity: true }}
        opacity={{ wind: 0.7, temperature: 0.5, precipitation: 0.5, pressure: 0.4 }}
        onToggleLayer={onToggleLayer}
        onOpacityChange={() => undefined}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Paid scarcity bonus' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);
    expect(onToggleLayer).toHaveBeenCalledWith('scarcity');
  });
});
