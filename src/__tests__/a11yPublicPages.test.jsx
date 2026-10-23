/** @jest-environment jsdom */
/**
 * Accessibility regression guard for the public pages (axe baseline 2026-10-23,
 * docs/a11y/2026-10-23-axe-baseline.md). Runs axe-core on key public pages rendered in jsdom and fails
 * on any serious or critical finding. Colour contrast is left to the theme work and to the visual QA
 * harness (`npm run qa:visual -- --axe`), because jsdom has no layout or computed colours; page-level
 * landmark rules are off here because a page is rendered without the app shell that owns <main>.
 */
import React from 'react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axe from 'axe-core';

const { default: PublicTestnetLandingPage } = await import('../pages/PublicTestnetLandingPage');
const { PublicGovernanceListPage } = await import('../pages/PublicGovernancePage');
const { default: PublicPolicyPage } = await import('../pages/PublicPolicyPage');
const { default: PublicDownloadsPage } = await import('../pages/PublicDownloadsPage');
const { default: PublicForecastersPage } = await import('../pages/PublicForecastersPage');

const AXE_OPTIONS = {
  rules: {
    'color-contrast': { enabled: false },
    region: { enabled: false },
    'landmark-one-main': { enabled: false },
    'page-has-heading-one': { enabled: false },
  },
};

async function seriousFindings(container) {
  const result = await axe.run(container, AXE_OPTIONS);
  return result.violations
    .filter(v => v.impact === 'serious' || v.impact === 'critical')
    .map(v => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}`);
}

const FORECASTERS = {
  success: true, period: '7d', status: 'available', coverage: { fromHeight: '1', throughHeight: '44370', complete: true, skippedRecords: '0' },
  asOf: { height: '44370', hash: 'ab'.repeat(32), time: '2026-10-18T07:00:00.000000Z', checkedAt: '2026-10-18T07:00:05.000Z' },
  network: { forecasters: '1', forecasts: '12', rewardsMintedCount: '12', rewardsMintedBaseUnits: '123456789012', rewardsMintedDisplay: '1234.56789012', rewardsWithReceiptCount: '0', rewardsBaselineCount: '12', blocks: '7000', blocksWithoutCounters: '0', meanSkill: { status: 'not_yet_available', reason: 'r' } },
  rows: [{ rank: 1, profileKey: 'c_0123456789abcdef01234567', shortAddress: '0x0000…00a1', address: null, isYou: false, forecasts: '12', forecastsPrevious: '9', forecastsDelta: '3', firstActiveAt: '2026-10-01T00:00:00.000000Z', lastActiveAt: '2026-10-18T06:00:00.000000Z', skill: { status: 'not_yet_available', reason: 'r' }, paid: { status: 'not_yet_available', reason: 'r' } }],
};
const GOVERNANCE_EMPTY = { success: true, count: 0, total: 0, offset: 0, limit: 20, hasMore: false, proposals: [] };

beforeEach(() => {
  globalThis.fetch = jest.fn(async input => {
    const { pathname } = new URL(String(input), 'https://test.invalid');
    const body = pathname.endsWith('/forecasters') ? FORECASTERS
      : pathname.endsWith('/governance/proposals') ? GOVERNANCE_EMPTY
        : null;
    if (!body) return new Response('{}', { status: 503, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  });
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

const pages = [
  ['home', () => render(<MemoryRouter><PublicTestnetLandingPage /></MemoryRouter>), () => screen.findByRole('heading', { level: 1 })],
  ['governance', () => render(<MemoryRouter initialEntries={['/governance/public']}><Routes><Route path="/governance/public" element={<PublicGovernanceListPage />} /></Routes></MemoryRouter>), () => screen.findAllByRole('heading')],
  ['terms', () => render(<MemoryRouter initialEntries={['/terms']}><PublicPolicyPage /></MemoryRouter>), () => screen.findByRole('heading', { level: 1 })],
  ['downloads', () => render(<MemoryRouter initialEntries={['/downloads']}><PublicDownloadsPage /></MemoryRouter>), () => screen.findAllByRole('heading')],
  ['forecasters', () => render(<MemoryRouter><PublicForecastersPage /></MemoryRouter>), () => screen.findAllByTestId('forecaster-row')],
];

test.each(pages)('%s has no serious or critical axe finding', async (_name, mount, settled) => {
  const { container } = mount();
  await settled();
  await waitFor(() => expect(container.querySelector('[role="status"]')?.textContent ?? '').not.toMatch(/Loading/));
  expect(await seriousFindings(container)).toEqual([]);
}, 20000);

test('the guard is not blind: a planted image without alt text is reported', async () => {
  const { container } = render(<div><img src="data:," /></div>);
  expect((await seriousFindings(container)).some(f => f.startsWith('image-alt'))).toBe(true);
});

// The app shell renders the one <main> landmark (App.jsx); a page that renders its own <main> nests a
// second one inside it (axe landmark-main-is-top-level / landmark-no-duplicate-main).
test('only the app shell renders a <main> element', () => {
  const files = [];
  const walk = dir => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) { if (entry !== '__tests__' && entry !== 'stories') walk(path); continue; }
      if (/\.(jsx|tsx)$/.test(entry)) files.push(path);
    }
  };
  walk(join(process.cwd(), 'src'));
  const offenders = files.filter(f => !f.endsWith(join('src', 'App.jsx')) && /<main\b/.test(readFileSync(f, 'utf8')));
  expect(offenders).toEqual([]);
});
