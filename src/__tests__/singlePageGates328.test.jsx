/** @jest-environment jsdom */
//
// frontend#328 — six single-page fabrications: IoT device counts, sharding
// metrics, the 3D network view, the globe's wind/precip layers, the
// developer usage chart and the Proof-of-Meme viral feed.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const featuresMock = { demoSurfaces: false };
jest.unstable_mockModule('../config/features', () => ({ default: featuresMock, FEATURES: featuresMock }));
jest.unstable_mockModule('react-chartjs-2', () => ({
  Radar: () => React.createElement('div'), Bar: () => React.createElement('div'), Pie: () => React.createElement('div'),
  Line: () => React.createElement('div'), Doughnut: () => React.createElement('div'),
}));
jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {}, LinearScale: class {}, BarElement: class {}, PointElement: class {}, LineElement: class {},
  ArcElement: class {}, Filler: class {}, Tooltip: class {}, Legend: class {}, Title: class {}, RadialLinearScale: class {},
}));
jest.unstable_mockModule('../services/blockchainService', () => ({ default: {} }));
jest.unstable_mockModule('../services/websocketService', () => ({ getWebSocketClient: () => ({ on: () => () => {}, connect: () => {}, status: 'disconnected' }) }));
jest.unstable_mockModule('../hooks/useWebSocket', () => ({ default: () => ({ data: null, connected: false, lastMessage: null }) }));
jest.unstable_mockModule('../contexts/SocialAuthContext', () => ({ useSocialAuthContext: () => ({ walletAddress: null }) }));
jest.unstable_mockModule('../components/social/ProofOfMemeDashboard', () => ({ ProofOfMemeDashboard: () => React.createElement('div', { 'data-testid': 'meme-dashboard' }) }));

const { default: IoTDashboard } = await import('../components/IoT/IoTDashboard');
const { default: ShardingDashboard } = await import('../components/ShardingDashboard/ShardingDashboard');
const { default: NetworkVisualization3D } = await import('../components/Analytics/NetworkVisualization3D');
const { default: UsageAnalytics } = await import('../components/developer/UsageAnalytics');
const { default: ProofOfMemePage } = await import('../pages/ProofOfMemePage');

const GATED = [
  ['iot-dashboard', 'IoT device telemetry is not live on the testnet yet', () => <IoTDashboard />],
  ['sharding-dashboard', 'Sharding metrics are not live on the testnet yet', () => <ShardingDashboard />],
  ['network-3d', 'Network visualization is not live on the testnet yet', () => <NetworkVisualization3D />],
];

describe('single-page gates — demo mode OFF (default)', () => {
  beforeEach(() => { featuresMock.demoSurfaces = false; });

  it.each(GATED)('%s renders the not-live notice only', (testId, title, make) => {
    const { unmount } = render(make());
    expect(screen.getByTestId(`${testId}-not-live`)).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Sample data/);
    unmount();
  });

  it('UsageAnalytics draws no random request-volume bars once the real analytics load', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({
        data: {
          overview: { totalRequests: 0, requestsToday: 0, activeApiKeys: 0, averageResponseTime: 0, errorRate: 0, requestsThisMonth: 0 },
          apiKeys: [],
        },
      }),
    }));
    render(<UsageAnalytics userId="u1" />);
    await waitFor(() => {
      expect(screen.getByTestId('usage-volume-not-live')).toBeInTheDocument();
    });
    expect(document.querySelectorAll('.chart-bar').length).toBe(0);
    expect(screen.getByTestId('usage-endpoints-not-live')).toBeInTheDocument();
    expect(document.querySelectorAll('.endpoint-item').length).toBe(0);
    expect(document.body.textContent).not.toMatch(/8\.3K|requests\b/);
    // frontend#343 (same file): the hard-coded status-code split is gone too.
    expect(screen.getByTestId('usage-status-not-live')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/94\.2%|2\.1%|3\.2%|0\.5%/);
    expect(document.querySelectorAll('.status-item').length).toBe(0);
  });

  it('ProofOfMemePage shows no invented viral posts or engagement counts', () => {
    render(<ProofOfMemePage />);
    expect(screen.getByTestId('meme-posts-not-live')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/engagements|4\.2k/);
    expect(screen.queryByTestId('meme-posts-sample-badge')).not.toBeInTheDocument();
  });

  it('WeatherGlobe only feeds the synthetic wind/precip layers under demo surfaces (source gate)', () => {
    const src = readFileSync(fileURLToPath(new URL('../components/WeatherGlobe/WeatherGlobe.tsx', import.meta.url)), 'utf8');
    expect(src).toMatch(/useWindParticles\(windCanvasRef, rotation, layers\.windFlow && syntheticLayersAllowed/);
    expect(src).toMatch(/usePrecipRenderer\(precipCanvasRef, rotation, layers\.precipitation && syntheticLayersAllowed/);
    expect(src).toMatch(/const syntheticLayersAllowed = FEATURES\.demoSurfaces;/);
  });
});

describe('single-page gates — demo mode ON', () => {
  beforeEach(() => { featuresMock.demoSurfaces = true; });

  it('IoTDashboard renders the sample only under the badge', () => {
    render(<IoTDashboard />);
    expect(screen.getByTestId('iot-dashboard-sample-badge')).toBeInTheDocument();
  });

  it('ProofOfMemePage labels the sample posts', () => {
    render(<ProofOfMemePage />);
    expect(screen.getByTestId('meme-posts-sample-badge')).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/engagements/);
  });
});
