/** @jest-environment jsdom */
/**
 * frontend#354 — the real PoP dashboard. No backend route serves PoP
 * participants, rewards or validation rates, and the deployed API does not
 * mount /api/consensus/settings. The default build must show none of the
 * former seeded figures; the demo build shows them only under a sample badge.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const featureFlags = { demoSurfaces: false, fullStudio: false, publicReadonly: false };

await jest.unstable_mockModule('../../../config/features', () => ({
  FEATURES: featureFlags,
  default: featureFlags,
  isMvpMode: () => true,
}));

const { default: PopDashboard } = await import('../PopDashboard');

// Seeded literals of the former dashboard (PopDashboard.jsx @ main).
const FABRICATED = [
  '94.3%', '+2.7% from last week', 'AcuRite', 'wrf717d72395303fcb2aed4df368f32f1078d18e9cc',
  'amazon_forecaster', 'Amazon Rainforest', '145.30', '138.29', '78.2%', '73.6%',
];
const DEFAULT_SETTINGS_FALLBACKS = ['60 seconds', '24 hours', '75%'];

let consensusResponse;
beforeEach(() => {
  consensusResponse = () => new Response('Not found', { status: 404 });
  global.fetch = jest.fn(async input =>
    String(input).includes('/api/consensus/settings')
      ? consensusResponse()
      : new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
  );
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  featureFlags.demoSurfaces = false;
});

async function renderPop() {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/pop']}>
        <PopDashboard />
      </MemoryRouter>,
    );
  });
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
}

const TABS = [
  ['Overview', 'pop-overview'],
  ['Weather Stations', 'pop-weather-stations'],
  ['Environmental Forecasting', 'pop-forecasting'],
  ['Algorithm Developers', 'pop-algorithm-developers'],
];

describe('PoP dashboard, default build', () => {
  it.each(TABS)('%s tab: honest not-live state and no seeded figures', async (label, testId) => {
    await renderPop();
    fireEvent.click(screen.getByRole('tab', { name: label }));
    expect(await screen.findByTestId(`${testId}-not-live`)).not.toBeNull();
    expect(screen.queryByTestId(`${testId}-sample-badge`)).toBeNull();
    const page = document.body.textContent ?? '';
    for (const literal of FABRICATED) expect(page).not.toContain(literal);
  });

  it('consensus settings unavailable: no invented defaults', async () => {
    await renderPop();
    expect((await screen.findByTestId('pop-consensus-unavailable')).textContent).toMatch(
      /not available from the testnet API/,
    );
    const page = document.body.textContent ?? '';
    for (const literal of DEFAULT_SETTINGS_FALLBACKS) expect(page).not.toContain(literal);
    expect(page).not.toContain('Using default values');
    expect(screen.queryByText('Min. Publishers')).toBeNull();
  });

  it('consensus settings served: cards show exactly the served values', async () => {
    consensusResponse = () =>
      new Response(
        JSON.stringify({
          mechanism: 'ProofOfPublishing',
          parameters: { minPublishers: 7, dataValidityThreshold: 0.5, reviewPeriod: 12 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    await renderPop();
    await screen.findByText('Min. Publishers');
    const page = document.body.textContent ?? '';
    expect(page).toContain('7');
    expect(page).toContain('50%');
    expect(page).toContain('12 hours');
    expect(screen.queryByTestId('pop-consensus-unavailable')).toBeNull();
  });
});

// Codex round 8 on #390: a successful response without a block time must not
// be given one from a per-mechanism constant ("60 seconds").
describe('PoP consensus block time', () => {
  function serve(body) {
    consensusResponse = () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
  }
  const blockTimeCard = () => screen.getByText('Block Time').parentElement;

  it('success without a block time: "—", never an invented duration', async () => {
    serve({ mechanism: 'ProofOfPublishing', parameters: { minPublishers: 7 } });
    await renderPop();
    await screen.findByText('Block Time');
    expect(blockTimeCard().textContent).toBe('Block Time—');
    expect(document.body.textContent).not.toContain('60 seconds');
  });

  it.each([
    [{ blockTime: '15 seconds' }, '15 seconds'],
    [{ blockTime: 12 }, '12 seconds'],
    [{ blockTime: '  ' }, '—'],
    [{ blockTime: -5 }, '—'],
    [{ blockTime: { seconds: 60 } }, '—'],
  ])('served %p shows %p', async (extra, expected) => {
    serve({ mechanism: 'ProofOfPublishing', parameters: {}, ...extra });
    await renderPop();
    await screen.findByText('Block Time');
    expect(blockTimeCard().textContent).toBe(`Block Time${expected}`);
  });
});

// Codex round 11 on #390: Submit Validation called a popService method that
// does not exist (TypeError, no request). The deployed API mounts no /api/pop,
// so the control is disabled and says why.
describe('PoP Validate Data tab', () => {
  it('Submit Validation is disabled with an honest reason and sends nothing', async () => {
    await renderPop();
    fireEvent.click(screen.getByRole('tab', { name: 'Validate Data' }));
    const note = await screen.findByTestId('pop-attestation-unavailable');
    expect(note.textContent).toMatch(/not accepted by the testnet API yet/);
    const submit = screen.getByRole('button', { name: 'Submit Validation' });
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText(/submission ID/i), { target: { value: 'sub-1' } });
    expect(submit.disabled).toBe(true);
    fireEvent.submit(submit.closest('form'));
    await waitFor(() => expect(screen.getByText(/not accepted by the testnet API yet/, { selector: 'p:not([data-testid])' })).not.toBeNull());
    const posts = global.fetch.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(posts).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/Attestation Submitted Successfully|is not a function/);
  });
});

// Codex round 15 on #390: the Submit Data tab POSTed to the unmounted
// /api/pop/submit. It is held to the same bar as Validate Data.
describe('PoP Submit Data tab', () => {
  it('Submit Environmental Data is disabled with an honest reason and sends nothing', async () => {
    await renderPop();
    fireEvent.click(screen.getByRole('tab', { name: 'Submit Data' }));
    const note = await screen.findByTestId('pop-submission-unavailable');
    expect(note.textContent).toMatch(/not accepted by the testnet API yet/);
    const submit = screen.getByRole('button', { name: 'Submit Environmental Data' });
    expect(submit.disabled).toBe(true);
    fireEvent.submit(submit.closest('form'));
    await waitFor(() =>
      expect(screen.getAllByText(/Environmental data submissions are not accepted/).length).toBeGreaterThan(1),
    );
    const posts = global.fetch.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(posts).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/submitted successfully|Failed to submit/);
  });
});

// core4#28 (owner answer A1): the scarcity display is the rule the chain pays, read live; the
// former invented region table (Amazon 3.0x, Arctic 2.5x, Sahara 2.0x) is gone from every build.
describe('PoP Data Scarcity tab', () => {
  const body = {
    source: 'chain',
    observedAtHeight: 77,
    rule: { gridKm: 222, cellSizeDegrees: 2, minStationDensity: 3, desertBonusMultiplier: 1.5, baselineMultiplier: 1, activationHeight: 0, active: true },
    zones: [{ lat: 47, lng: -93, radius: 111, type: 'sparse', rewardMultiplier: 1.5, stationCount: 2 }],
  };

  it('shows the served rule in the default build, not a sample', async () => {
    const base = global.fetch;
    global.fetch = jest.fn(async (input, init) =>
      String(input).includes('/api/weather/coverage-zones')
        ? new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
        : base(input, init),
    );
    await renderPop();
    fireEvent.click(screen.getByRole('tab', { name: 'Data Scarcity' }));
    expect((await screen.findByTestId('scarcity-rule')).textContent).toMatch(/fewer than 3 active registered stations/);
    expect(screen.queryByTestId('pop-scarcity-sample-badge')).toBeNull();
  });

  it('is unavailable, with no rule, when the API cannot say', async () => {
    await renderPop();
    fireEvent.click(screen.getByRole('tab', { name: 'Data Scarcity' }));
    expect(await screen.findByTestId('scarcity-unavailable')).not.toBeNull();
  });

  it.each([false, true])('no invented region multipliers (demoSurfaces=%s)', async demo => {
    featureFlags.demoSurfaces = demo;
    await renderPop();
    fireEvent.click(screen.getByRole('tab', { name: 'Environmental Forecasting' }));
    await screen.findByTestId(demo ? 'pop-forecasting-sample-badge' : 'pop-forecasting-not-live');
    const page = document.body.textContent ?? '';
    for (const literal of ['Geographic Scarcity Bonuses', 'Sahara Desert', 'Arctic Circle', 'Scarcity Multiplier']) {
      expect(page).not.toContain(literal);
    }
  });
});

describe('PoP dashboard, demo build', () => {
  it('shows the sample only under a sample badge', async () => {
    featureFlags.demoSurfaces = true;
    await renderPop();
    expect(await screen.findByTestId('pop-overview-sample-badge')).not.toBeNull();
    expect(document.body.textContent).toContain('94.3%');
  });
});
