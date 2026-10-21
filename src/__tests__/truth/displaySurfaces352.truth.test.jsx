/** @jest-environment jsdom */
/**
 * frontend#352 — the remaining display-only second-wave surfaces. Every one
 * renders an honest not-live state in the default build (demoSurfaces off)
 * and mounts nothing fabricated. In the demo build, the samples whose
 * controls used to fake an outcome show those controls disabled, and no
 * timer produces a success. Only feature flags, fetch and chart libraries
 * are faked.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const featureFlags = { demoSurfaces: false, fullStudio: true, publicReadonly: false };
await jest.unstable_mockModule('../../config/features', () => ({
  FEATURES: featureFlags,
  default: featureFlags,
  isMvpMode: () => false,
}));
for (const lib of ['react-chartjs-2']) {
  await jest.unstable_mockModule(lib, () => ({
    Line: () => null, Bar: () => null, Doughnut: () => null, Pie: () => null, Radar: () => null, Scatter: () => null,
  }));
}

const SURFACES = [
  ['CollaborativeAnalysis/CollaborativeAnalysis', 'collaboration'],
  ['CollaborativeAnalysis/WorkspaceEditor', 'collaboration-editor'],
  ['ExecutionDebugger/StateDebugger', 'state-debugger'],
  ['ExecutionDebugger/TransactionInspector', 'transaction-inspector'],
  ['AccessibilityHub/ScreenReaderHelper', 'screen-reader-audit'],
  ['CarbonTracking/CarbonTrackingDashboard', 'carbon-tracking'],
  ['CarbonReporting/ScopeBreakdown', 'carbon-scope-breakdown'],
  ['CarbonReporting/CreditVerification', 'carbon-credit-verification'],
  ['ValidatorOps/SlashingMonitor', 'slashing-monitor'],
  ['ValidatorOps/ValidatorCompare', 'validator-compare'],
  ['Integrations/StoryProtocol/IPKit', 'story-ipkit'],
  ['Integrations/StoryProtocol/NFTOracle', 'story-nft-oracle'],
  ['Integrations/StoryProtocol/ProtocolContracts', 'story-protocol-contracts'],
  ['Integrations/SonmCard', 'sonm'],
  ['Luftdaten/LuftdatenDashboard', 'luftdaten'],
  ['developer/ApiDocumentation', 'api-documentation'],
  ['developer/SDKDownloads', 'sdk-downloads'],
  ['I18n/LanguageSwitcher', 'language-preview'],
  ['I18n/TranslationManager', 'translation-manager'],
  ['Notifications/PushSetup', 'push-setup'],
  ['Settings/CrossChainConfigPage', 'cross-chain-config'],
  ['Settings/ModuleManagementPage', 'module-management'],
];

const modules = {};
for (const [path] of SURFACES) {
  modules[path] = (await import(`../../components/${path}`)).default;
}

// Former fabricated literals (sample data from each file on main).
const FABRICATED = [
  '12,487', '847,392', '243,581.45 SNM', '15420', '15,420', 'user_123',
  'This is a simulated API response', 'Q1 2026 Hurricane Season Outlook',
];
const SUCCESS = /saved successfully|registered successfully|restarted|subscribed|verified successfully|test (passed|successful)|simulated API response|Saved|All changes saved|submitted for review|Your Recent Suggestions|Activity tracked/i;

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn(async () => {}) } });
  // WrfDataTable's local CSV export (client-side, no request) needs these; jsdom lacks them.
  URL.createObjectURL = jest.fn(() => 'blob:test');
  URL.revokeObjectURL = jest.fn();
  global.fetch = jest.fn(async () => new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } }));
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
  featureFlags.demoSurfaces = false;
});

async function renderSurface(path) {
  const Component = modules[path];
  await act(async () => {
    render(<MemoryRouter><Component /></MemoryRouter>);
  });
}

describe('default build: every surface is an honest not-live state', () => {
  it.each(SURFACES)('%s', async (path, testId) => {
    await renderSurface(path);
    expect(screen.getByTestId(`${testId}-not-live`)).not.toBeNull();
    expect(screen.queryByTestId(`${testId}-sample`)).toBeNull();
    for (const literal of FABRICATED) expect(document.body.textContent).not.toContain(literal);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// The samples whose controls used to fake an outcome (timers, local-only
// "saved"/"restarted"/"registered" state, invented API responses).
const selectFirstDataset = async () => {
  fireEvent.click(screen.getByText('Global Temperature Dataset 2023-Q1'));
  await act(async () => { jest.advanceTimersByTime(3000); });
};
// Codex round 27 on #396: controls that are only enabled once a form is
// filled or a tab is open must be exercised in that state.
const fillSuggestion = async () => {
  fireEvent.change(screen.getByLabelText('Translation Key'), { target: { value: 'nav.home' } });
  fireEvent.change(screen.getByLabelText(/^Translation \(/), { target: { value: 'Inicio' } });
};
const openTrackTab = async () => {
  await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Track Activity' })); });
};
const ACTION_SAMPLES = [
  ['I18n/TranslationManager', 'translation-manager', fillSuggestion],
  ['CarbonTracking/CarbonTrackingDashboard', 'carbon-tracking', openTrackTab],
  ['Notifications/PushSetup', 'push-setup', null],
  ['Integrations/StoryProtocol/IPKit', 'story-ipkit', null],
  ['Integrations/StoryProtocol/NFTOracle', 'story-nft-oracle', null],
  ['Integrations/StoryProtocol/ProtocolContracts', 'story-protocol-contracts', selectFirstDataset],
  ['Settings/CrossChainConfigPage', 'cross-chain-config', null],
  ['Settings/ModuleManagementPage', 'module-management', null],
  ['developer/SDKDownloads', 'sdk-downloads', null],
  ['Integrations/SonmCard', 'sonm', null],
  ['CollaborativeAnalysis/WorkspaceEditor', 'collaboration-editor', null],
];

describe('demo build: sample controls cannot produce an outcome', () => {
  it.each(ACTION_SAMPLES)('%s', async (path, testId, prepare) => {
    featureFlags.demoSurfaces = true;
    const thrown = [];
    const onError = event => { thrown.push(event.error ?? event.message); event.preventDefault(); };
    window.addEventListener('error', onError);
    jest.useFakeTimers();
    await renderSurface(path);
    await act(async () => { jest.advanceTimersByTime(3000); });
    if (prepare) await prepare();
    const sample = screen.getByTestId(`${testId}-sample`);
    expect(screen.getByTestId(`${testId}-sample-badge`).textContent).toBe('Sample data');
    const disabled = within(sample).queryAllByTitle(/^Sample only:/);
    expect(disabled.length).toBeGreaterThan(0);
    for (const el of disabled) expect(el.disabled).toBe(true);
    // Press everything a user could press, then let any timers run.
    for (const button of within(sample).queryAllByRole('button')) {
      await act(async () => { fireEvent.click(button); });
    }
    for (const form of sample.querySelectorAll('form')) {
      await act(async () => { fireEvent.submit(form); });
    }
    await act(async () => { jest.advanceTimersByTime(10_000); });
    window.removeEventListener('error', onError);
    expect(document.body.textContent).not.toMatch(SUCCESS);
    const writes = global.fetch.mock.calls.filter(([, init]) => init?.method && init.method !== 'GET');
    expect(writes).toEqual([]);
    expect(thrown).toEqual([]);
  });
});

describe('demo build: named controls from codex round 27 are inert', () => {
  it('Suggest Translation with a filled form is disabled and submits nothing', async () => {
    featureFlags.demoSurfaces = true;
    await renderSurface('I18n/TranslationManager');
    await fillSuggestion();
    const suggest = screen.getByRole('button', { name: /Suggest Translation/ });
    expect(suggest.disabled).toBe(true);
    expect(suggest.getAttribute('title')).toMatch(/^Sample only:/);
    await act(async () => { fireEvent.click(suggest); });
    expect(document.body.textContent).not.toMatch(/submitted for review|Your Recent Suggestions/);
  });

  it('carbon quick-track buttons are disabled and never POST /api/carbon/track', async () => {
    featureFlags.demoSurfaces = true;
    await renderSurface('CarbonTracking/CarbonTrackingDashboard');
    await openTrackTab();
    for (const name of [/Car Trip/, /Flight/, /Home Energy/, /Beef Meal/]) {
      const button = screen.getByRole('button', { name });
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('title')).toMatch(/^Sample only:/);
      await act(async () => { fireEvent.click(button); });
    }
    const tracks = global.fetch.mock.calls.filter(([input]) => String(input).includes('/api/carbon/track'));
    expect(tracks).toEqual([]);
  });

  it('SDK resource links are disabled buttons that download and track nothing', async () => {
    featureFlags.demoSurfaces = true;
    const thrown = [];
    const onError = event => { thrown.push(event.error ?? event.message); event.preventDefault(); };
    window.addEventListener('error', onError);
    jest.useFakeTimers();
    await renderSurface('developer/SDKDownloads');
    await act(async () => { jest.advanceTimersByTime(3000); });
    const sample = screen.getByTestId('sdk-downloads-sample');
    expect(sample.querySelectorAll('a[href="#"]')).toHaveLength(0);
    for (const name of ['Example Projects', 'API Reference', 'Changelog', 'Migration Guide']) {
      const card = within(sample).getByRole('button', { name: new RegExp(name) });
      expect(card.disabled).toBe(true);
      expect(card.getAttribute('title')).toMatch(/^Sample only:/);
      await act(async () => { fireEvent.click(card); });
    }
    window.removeEventListener('error', onError);
    expect(thrown).toEqual([]);
    expect(global.fetch.mock.calls.filter(([input]) => String(input).includes('track-download'))).toEqual([]);
  });
});
