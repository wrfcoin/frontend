/** @jest-environment jsdom */
/**
 * core4#28 / ADR 2026-10-23-3563 (owner answer A1): the scarcity display shows the rule the
 * chain pays, read from /api/weather/coverage-zones (the backend's proxy of core4
 * GET /network/scarcity). Nothing about the rule is hard-coded here: every figure shown comes
 * from that response, and an unreadable response is "unavailable", not a remembered rule.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

const { default: ScarcityRulePanel } = await import('../ScarcityRulePanel');
const { parseCoverageRule } = await import('../../../hooks/useScarcityRule');

const RULE = {
  gridKm: 222, cellSizeDegrees: 2, minStationDensity: 3, desertBonusMultiplier: 1.5,
  baselineMultiplier: 1, activationHeight: 0, active: true,
};
const BODY = {
  source: 'chain',
  observedAtHeight: 4242,
  rule: RULE,
  zones: [
    { lat: 47, lng: -93, radius: 111, type: 'sparse', rewardMultiplier: 1.5, stationCount: 2 },
    { lat: 41, lng: -81, radius: 111, type: 'covered', rewardMultiplier: 1, stationCount: 5 },
  ],
};

function mockFetch(impl) {
  global.fetch = jest.fn(impl);
}
const ok = body => async () => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

afterEach(() => cleanup());

async function renderPanel() {
  await act(async () => {
    render(<ScarcityRulePanel />);
  });
}

describe('ScarcityRulePanel', () => {
  it('states the paid rule from the response and draws one rect per chain cell', async () => {
    mockFetch(ok(BODY));
    await renderPanel();
    const rule = await screen.findByTestId('scarcity-rule');
    expect(rule.textContent).toMatch(/fewer than 3 active registered stations/i);
    expect(rule.textContent).toMatch(/×1\.5/);
    expect(rule.textContent).toMatch(/2° cell/);
    expect(rule.textContent).toMatch(/block 4,?242/);
    expect(screen.getByTestId('scarcity-cell-47_-93').getAttribute('data-multiplier')).toBe('1.5');
    expect(screen.getByTestId('scarcity-cell-41_-81').getAttribute('data-multiplier')).toBe('1');
    expect(screen.getAllByTestId(/^scarcity-cell-/)).toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledWith('/api/weather/coverage-zones', expect.objectContaining({ credentials: 'omit' }));
  });

  it('shows the rule values it was given, not constants (threshold 4, ×1.25)', async () => {
    mockFetch(ok({ ...BODY, rule: { ...RULE, minStationDensity: 4, desertBonusMultiplier: 1.25 }, zones: [] }));
    await renderPanel();
    const rule = await screen.findByTestId('scarcity-rule');
    expect(rule.textContent).toMatch(/fewer than 4/i);
    expect(rule.textContent).toMatch(/×1\.25/);
  });

  it('says the bonus is not active yet before the activation height', async () => {
    mockFetch(ok({ ...BODY, rule: { ...RULE, active: false, activationHeight: 9000 } }));
    await renderPanel();
    expect((await screen.findByTestId('scarcity-rule')).textContent).toMatch(/not active until block 9,?000/i);
  });

  it.each([
    ['503', async () => new Response('{}', { status: 503 })],
    ['network error', async () => { throw new Error('offline'); }],
    ['malformed body', ok({ zones: 'nope' })],
    ['a multiplier the chain cannot pay', ok({ ...BODY, zones: [{ ...BODY.zones[0], rewardMultiplier: 3 }] })],
  ])('unavailable on %s: no rule, no cells, no invented values', async (_n, impl) => {
    mockFetch(impl);
    await renderPanel();
    expect(await screen.findByTestId('scarcity-unavailable')).not.toBeNull();
    expect(screen.queryByTestId('scarcity-rule')).toBeNull();
    expect(screen.queryAllByTestId(/^scarcity-cell-/)).toHaveLength(0);
    const page = document.body.textContent ?? '';
    for (const literal of ['×1.5', 'Sahara', 'Amazon', '2.5', '3.0']) expect(page).not.toContain(literal);
  });
});

describe('parseCoverageRule', () => {
  it('accepts the backend body and rejects a missing rule', () => {
    expect(parseCoverageRule(BODY)?.zones).toHaveLength(2);
    expect(parseCoverageRule({ ...BODY, rule: undefined })).toBeNull();
    expect(parseCoverageRule(null)).toBeNull();
  });
});
