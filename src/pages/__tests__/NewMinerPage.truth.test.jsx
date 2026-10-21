/** @jest-environment jsdom */
/**
 * frontend#355 / #354 — the real /miner page. The status comes from the real
 * MiningContext node-stats poll, nothing claims the browser controls mining,
 * and hardware telemetry is a gated sample. Only the network services,
 * features, icons and WebSocket are faked.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const featureFlags = { demoSurfaces: false, fullStudio: false, publicReadonly: false };
const apiGet = jest.fn();
const getNodeStats = jest.fn();
const getHardwareInfo = jest.fn();
const getPoolInfo = jest.fn();
const getWeatherStations = jest.fn();

await jest.unstable_mockModule('../../config/features', () => ({
  FEATURES: featureFlags,
  default: featureFlags,
}));
await jest.unstable_mockModule('../../services/apiClient', () => ({
  apiClient: { get: apiGet },
}));
await jest.unstable_mockModule('../../services/api', () => ({
  miningAPI: { getNodeStats, getHardwareInfo, getPoolInfo },
  weatherEarningsAPI: { getWeatherStations },
}));
await jest.unstable_mockModule('../../utils/wsUrl.js', () => ({
  resolveWsUrl: () => 'ws://test.invalid/mining',
}));
const ICONS = [
  'Activity', 'Award', 'BarChart2', 'BarChart3', 'ChevronDown', 'ChevronUp', 'Clock',
  'Cloud', 'Coins', 'Cpu', 'DollarSign', 'Fan', 'HardDrive', 'MapPin', 'Plus', 'Radio',
  'RefreshCw', 'Save', 'Server', 'Settings', 'Shield', 'Target', 'Thermometer',
  'TrendingUp', 'Users', 'Wallet', 'Wifi', 'WifiOff', 'Zap', 'Play', 'Pause', 'Square',
];
await jest.unstable_mockModule('lucide-react', () =>
  Object.fromEntries(ICONS.map(name => [name, () => null])),
);

class FakeWebSocket {
  close() {}
}
globalThis.WebSocket = FakeWebSocket;

// #432: load the real lazy UI graph before the per-case timeout starts.
// Cold ts-jest transforms under concurrent suites otherwise consume the first
// node-status assertion's five-second budget. No component is replaced and
// NewMinerPage still mounts through its production lazy/Suspense boundary.
// Link shared ESM dependencies one at a time: hosted workers otherwise fail
// during parallel preloads ("react/jsx-runtime is not in cache").
for (const load of [
  () => import('../../components/Miner/v2/MinerHero'),
  () => import('../../components/Miner/v2/MiningControlsPanel'),
  () => import('../../components/Miner/v2/MiningStatsSection'),
  () => import('../../components/Miner/v2/HardwareStatusSection'),
  () => import('../../components/Miner/v2/WeatherStationSection'),
  () => import('../../components/Miner/v2/PoolStatusSection'),
  () => import('../../components/Miner/v2/PerformanceSection'),
  () => import('../../components/Miner/v2/ConfigurationSection'),
  () => import('../../components/Miner/v2/MobileBottomNav'),
]) await load();

const { default: NewMinerPage } = await import('../NewMinerPage');

const NODE_STATS = {
  success: true,
  data: { node_id: 'node-1', status: 'synced', uptime: 3600, block_height: 12345, sync_status: 'synced' },
};

async function renderMiner() {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/miner']}>
        <NewMinerPage />
      </MemoryRouter>,
    );
  });
}

const badge = () => screen.getByTestId('miner-node-status');

beforeEach(() => {
  localStorage.clear();
  getNodeStats.mockReturnValue(new Promise(() => {}));
  getHardwareInfo.mockRejectedValue(new Error('501'));
  getPoolInfo.mockRejectedValue(new Error('501'));
  getWeatherStations.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.clearAllMocks();
  featureFlags.demoSurfaces = false;
});

describe('/miner status comes from the node-stats poll (frontend#355)', () => {
  it('node-stats OK: NODE ONLINE', async () => {
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    await waitFor(() => expect(badge().textContent).toBe('NODE ONLINE'));
    expect(apiGet).toHaveBeenCalledWith('/mining/node-stats');
    expect(screen.getByTestId('miner-panel-node-status').textContent).toBe('NODE ONLINE');
    expect(screen.getByTestId('hero-node-status').textContent).toBe('Node online');
  });

  it('node-stats failing (503): NODE UNREACHABLE', async () => {
    apiGet.mockRejectedValue(new Error('HTTP 503'));
    await renderMiner();
    await waitFor(() => expect(badge().textContent).toBe('NODE UNREACHABLE'));
    expect(screen.getByTestId('miner-panel-node-status').textContent).toBe('NODE UNREACHABLE');
  });

  it('no response yet: STATUS UNKNOWN, and time alone never changes it', async () => {
    jest.useFakeTimers();
    apiGet.mockReturnValue(new Promise(() => {}));
    await renderMiner();
    expect(badge().textContent).toBe('STATUS UNKNOWN');
    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });
    expect(badge().textContent).toBe('STATUS UNKNOWN');
    expect(screen.queryByText(/PROCESSING ACTIVE/)).toBeNull();
    expect(screen.queryByText(/INITIALIZING/)).toBeNull();
  });

  it('offers no control that implies the browser starts or stops mining', async () => {
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    await waitFor(() => expect(badge().textContent).toBe('NODE ONLINE'));
    const controlWords = /start|stop|pause|resume|processing method/i;
    for (const button of screen.queryAllByRole('button')) {
      expect(button.textContent).not.toMatch(controlWords);
    }
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByText(/PROCESSING ACTIVE|PAUSED/)).toBeNull();
    const panel = screen.getByTestId('miner-contribution-panel');
    expect(within(panel).getByText(/nothing to start or stop in the browser/)).not.toBeNull();
    expect(
      within(panel).getByTestId('miner-connect-station-link').getAttribute('href'),
    ).toBe('/connect-station');
  });

  it('shows no invented processing speed', async () => {
    apiGet.mockResolvedValue(NODE_STATS);
    getNodeStats.mockResolvedValue(NODE_STATS);
    await renderMiner();
    await waitFor(() => expect(badge().textContent).toBe('NODE ONLINE'));
    expect(screen.getByTestId('hashrate-value').textContent).toBe('—obs/min');
  });
});

describe('/miner hardware telemetry is a gated sample (frontend#354)', () => {
  it('default build: honest not-live state, no hardware figures, no 501 polling', async () => {
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    const notLive = await screen.findByTestId('miner-hardware-not-live');
    expect(notLive.textContent).toMatch(/not live on the testnet/);
    const page = document.body.textContent ?? '';
    for (const fabricated of ['Ryzen', 'RTX 4090', 'DDR5', 'RPM', '5950X']) {
      expect(page).not.toContain(fabricated);
    }
    expect(screen.queryByTestId('miner-hardware-sample-badge')).toBeNull();
    expect(getHardwareInfo).not.toHaveBeenCalled();
  });

  it('demo build: the sample appears only under a sample badge', async () => {
    featureFlags.demoSurfaces = true;
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    const sample = await screen.findByTestId('miner-hardware-sample');
    expect(within(sample).getByTestId('miner-hardware-sample-badge').textContent).toBe('Sample data');
    expect(sample.textContent).toContain('AMD Ryzen 9 5950X');
  });
});

// Codex round 8 on #390: the "Processing Configuration" section rendered an
// ungated fake control form (seeded wallet, Equihash, 80% intensity, 85%
// power limit, Start on System Boot, and a Save button with no handler).
describe('/miner configuration section is not a control surface', () => {
  const FAKE_CONFIG = [
    'wrf1q84sh2j72ez0ulgupk0jzfmz4j7kzfwj3dk4kv', 'Equihash', 'Start on System Boot',
    'Power Limit', 'Intensity', 'Low Priority',
  ];
  const originalWidth = window.innerWidth;

  afterEach(() => {
    window.innerWidth = originalWidth;
  });

  function expectHonestConfiguration() {
    const notLive = screen.getByTestId('miner-configuration-not-live');
    expect(notLive.textContent).toMatch(/configured on your station collector/);
    const page = document.body.textContent ?? '';
    for (const literal of FAKE_CONFIG) expect(page).not.toContain(literal);
    for (const button of screen.queryAllByRole('button')) {
      expect(button.textContent).not.toMatch(/^\s*(save|reset)\s*$/i);
    }
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('slider')).toBeNull();
  }

  it('expanded by the user: honest explanation, no form', async () => {
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    expect(screen.queryByTestId('miner-configuration-not-live')).toBeNull();
    fireEvent.click(screen.getByText('Processing Configuration'));
    await screen.findByTestId('miner-configuration-not-live');
    expectHonestConfiguration();
  });

  it('opened from a saved localStorage state: same honest explanation', async () => {
    localStorage.setItem('miner_section_config', 'true');
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    await screen.findByTestId('miner-configuration-not-live');
    expectHonestConfiguration();
  });

  it('mobile layout: bottom nav reports status only, and configuration stays honest', async () => {
    window.innerWidth = 500;
    localStorage.setItem('miner_section_config', 'true');
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    const status = await screen.findByTestId('miner-mobile-node-status');
    await waitFor(() => expect(status.textContent).toBe('Online'));
    expect(status.tagName).not.toBe('BUTTON');
    const nav = status.closest('nav');
    for (const button of within(nav).queryAllByRole('button')) {
      expect(button.textContent).not.toMatch(/start|stop|pause|resume/i);
    }
    await screen.findByTestId('miner-configuration-not-live');
    expectHonestConfiguration();
  });

  it('demo build: the form appears only under a sample badge', async () => {
    featureFlags.demoSurfaces = true;
    localStorage.setItem('miner_section_config', 'true');
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    const sample = await screen.findByTestId('miner-configuration-sample');
    expect(within(sample).getByTestId('miner-configuration-sample-badge').textContent).toBe('Sample data');
    expect(sample.textContent).toContain('Equihash');
  });
});

// Codex round 11 on #390: after a SUCCESSFUL pool-info response, "Network
// Connections" showed an enabled "Add Pool Connection" button with only hover
// handlers.
describe('/miner network connections after a successful pool-info response', () => {
  it('shows the served pool figures and no pretend control', async () => {
    getPoolInfo.mockResolvedValue({ totalHashRate: '12 obs/min', miners: 3, lastBlock: 4242, payout: 'PPLNS', fee: 1 });
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    fireEvent.click(screen.getByText('Network Connections'));
    const hashrate = await screen.findByTestId('pool-hashrate');
    expect(hashrate.textContent).toContain('12 obs/min');
    expect(screen.getByTestId('pool-miners').textContent).toContain('3');
    expect(getPoolInfo).toHaveBeenCalled();
    expect(screen.queryByText(/Add Pool Connection/)).toBeNull();
    expect(screen.getByTestId('pool-config-note').textContent).toMatch(/not configured from the browser/);
    const section = hashrate.closest('.miner-section');
    for (const button of within(section).queryAllByRole('button')) {
      expect(button.getAttribute('aria-label')).toMatch(/^(Collapse|Expand)$/);
    }
  });
});



describe('/miner unsupported controls are disabled with reasons', () => {
  const originalWidth = window.innerWidth;
  afterEach(() => { window.innerWidth = originalWidth; });

  it('default mobile footer shortcuts are unavailable rather than inert enabled buttons', async () => {
    window.innerWidth = 500;
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    const status = await screen.findByTestId('miner-mobile-node-status');
    await waitFor(() => expect(status.textContent).toBe('Online'));
    const nav = status.closest('nav');
    const reason = within(nav).getByText('Quick section navigation is unavailable. Use the page sections above.');
    for (const name of ['Hardware', 'Stats', 'Settings']) {
      const button = within(nav).getByRole('button', { name });
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-describedby')).toBe(reason.id);
      fireEvent.click(button);
    }
    expect(status.textContent).toBe('Online');
    expect(screen.getByTestId('miner-connect-station-link').getAttribute('href')).toBe('/connect-station');
  });

  it('configuration samples have disabled settings and operation buttons', async () => {
    featureFlags.demoSurfaces = true;
    localStorage.setItem('miner_section_config', 'true');
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    const sample = await screen.findByTestId('miner-configuration-sample');
    const reason = within(sample).getByText(/Configuration controls are unavailable/);
    const controls = sample.querySelectorAll('input, select, button');
    expect(controls).toHaveLength(8);
    for (const control of controls) {
      expect(control.disabled).toBe(true);
      expect(control.getAttribute('aria-describedby')).toBe(reason.id);
    }
    const before = apiGet.mock.calls.length;
    fireEvent.click(within(sample).getByRole('button', { name: 'Save' }));
    fireEvent.click(within(sample).getByRole('button', { name: 'Refresh configuration' }));
    expect(apiGet.mock.calls).toHaveLength(before);
    expect(sample.textContent).not.toMatch(/saved|applied|successfully/i);
  });

  it('sample configuration cannot change local processing values even via a synthetic change event', async () => {
    featureFlags.demoSurfaces = true;
    localStorage.setItem('miner_section_config', 'true');
    apiGet.mockResolvedValue(NODE_STATS);
    await renderMiner();
    const sample = await screen.findByTestId('miner-configuration-sample');
    const slider = within(sample).getAllByRole('slider')[0];
    fireEvent.change(slider, { target: { value: '10' } });
    expect(within(sample).getByText('Mining Intensity: 80%')).toBeTruthy();
    expect(within(sample).queryByText('Mining Intensity: 10%')).toBeNull();
  });
});
