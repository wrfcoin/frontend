import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { WeatherService } from '../weatherService';
import { EarningsService } from '../earningsService';
import { GovernanceService } from '../governanceService';
import { WalletService } from '../walletService';
import { ValidatorApiService } from '../validatorService';
import { ComputeService } from '../computeService';
import { formatBaseUnitsToWrf, toWrfNumberForChart } from '../number';

const evidenceRow = (tag, amountBaseUnits, blockTimestamp) => ({
  commitId: tag.repeat(32), rewarded: true, amountBaseUnits, amountWrf: '-',
  blocker: null, finalized: true, height: 7, blockTimestamp,
});

const baseUrls = {
  api: 'https://api.test',
  weather: 'https://api.test',
  earnings: 'https://api.test',
  governance: 'https://api.test',
  wallet: 'https://api.test',
  compute: 'https://api.test',
  validator: 'https://api.test',
};

const server = setupServer(
  // Real backend shape (weather-routes.js, anonymous caller): an envelope,
  // never a bare array; ownerAddress/totalRewards are stripped.
  http.get('https://api.test/weather/stations', () =>
    HttpResponse.json({
      stations: [
        { id: 'ws-1', stationId: 'ws-1', name: 'Station One', latitude: 40.71, longitude: -74.0, location: 'NYC', status: 'active', qualityScore: 92 },
      ],
      total: 1,
      hasMore: false,
      nextCursor: null,
      source: 'wrfcoin-contributors',
    }),
  ),
  http.get('https://api.test/stations/ws-1/observations', () =>
    HttpResponse.json({ observations: [{ timestamp: '2026-03-01T00:00:00.000Z', temperatureC: 21.5 }], source: 'core4' }),
  ),
  http.get('https://api.test/stations/ws-1/quality', () =>
    HttpResponse.json({ overall: 92, dimensions: [{ key: 'range', label: 'Range', score: 97 }], advisory: true, source: 'backend-db' }),
  ),
  http.get('https://api.test/stations/ws-1/submissions', () =>
    HttpResponse.json({ submissions: [{ id: 'sub-1', createdAt: '2026-03-01T00:00:00.000Z', status: 'revealed', chainStatus: 'revealed_attested' }], source: 'backend-db' }),
  ),

  http.get('https://api.test/stations/ws-1/earnings', () =>
    // The backend's real reward-evidence window (station-detail-routes.ts).
    HttpResponse.json({ earnings: [
      evidenceRow('e1', '150000000', '2026-03-01T01:00:00.000Z'),
      evidenceRow('e2', '200000000', '2026-03-01T02:00:00.000Z'),
    ], source: 'core4', window: { commits: 2, complete: true, scope: 'recent-observations' },
    totals: { rewardedCommits: 2, unknownCommits: 0, rewardedBaseUnits: '350000000', rewardedWrf: '3.5', note: 'sum over the recent window only, not a lifetime total' } }),
  ),

  http.get('https://api.test/governance/proposals', ({ request }) => {
    const limit = new URL(request.url).searchParams.get('limit');
    if (limit !== '25') {
      return HttpResponse.json({ proposals: [] });
    }
    return HttpResponse.json({ proposals: [{ id: 'p-1', title: 'Proposal 1', status: 'ACTIVE' }] });
  }),
  http.get('https://api.test/governance/delegations/delegator/wrf123', () =>
    HttpResponse.json({ delegations: [{ delegator: 'wrf123', delegate: 'wrf999', votingPower: 10 }] }),
  ),
  http.post('https://api.test/governance/proposals/p-1/vote', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, accepted: true, vote: body.vote, txHash: '0xtxvote' });
  }),

  http.get('https://api.test/wallet/wrf123', () =>
    HttpResponse.json({ address: 'wrf123', balance: '100', symbol: 'WRF' }),
  ),
  http.get('https://api.test/wallet/wrf123/transactions', () =>
    HttpResponse.json({ transactions: [{ id: 'tx-1', amount: '5', status: 'confirmed', timestamp: '2026-03-01T01:00:00.000Z' }] }),
  ),

  http.get('https://api.test/validators', () =>
    HttpResponse.json({ validators: [{ id: 'v-1', name: 'Validator A', status: 'online', balance: '10', effectiveness: 98, uptime: 99, proposals: 1, attestations: 20, missedSlots: 0, lastAttestation: '10s ago' }] }),
  ),
  http.get('https://api.test/staking/positions', () =>
    HttpResponse.json({ positions: [{ id: 's-1', validator: 'Validator A', amount: '10', apy: 5.2, status: 'active', delegatedAt: '2026-03-01T00:00:00.000Z', rewards: '120000000' }] }),
  ),
  http.get('https://api.test/validators/stats/overview', () =>
    HttpResponse.json({ totalStaked: '100', availableBalance: '50', totalRewards: '12', pendingRewards: '1' }),
  ),

  http.post('https://api.test/compute/tasks', () =>
    HttpResponse.json({ taskId: 'task-1', status: 'queued', createdAt: '2026-03-01T00:00:00.000Z' }),
  ),
  http.get('https://api.test/compute/tasks/task-1/status', () =>
    HttpResponse.json({ taskId: 'task-1', status: 'running', progress: 45 }),
  ),
  http.get('https://api.test/compute/tasks/task-1/results', () =>
    HttpResponse.json({ taskId: 'task-1', status: 'completed', results: { outputCid: 'bafy-output', verification_report_cid: 'bafy-verify', receipt_tx_hash: '0xtxhash' } }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('apiClient services (MSW)', () => {
  it('serves weather methods through MSW', async () => {
    const weatherService = new WeatherService(baseUrls);

    const stations = await weatherService.getStations();
    const observations = await weatherService.getLatestObservations('ws-1');
    const quality = await weatherService.getStationQuality('ws-1');
    const submissions = await weatherService.getSubmissionLog('ws-1');

    expect(stations[0]).toMatchObject({ id: 'ws-1', status: 'live', latitude: 40.71, longitude: -74.0 });
    expect(observations[0].temperatureC).toBe(21.5);
    expect(quality.overall).toBe(92);
    expect(submissions[0].id).toBe('sub-1');
    expect(submissions[0].success).toBe(true);
  });

  it('serves earnings methods through MSW', async () => {
    const earningsService = new EarningsService(baseUrls);

    const history = await earningsService.getStationHistory('ws-1');
    const summary = await earningsService.getStationSummary('ws-1');

    expect(history).toHaveLength(2);
    // A recent-window total, never a lifetime one.
    expect(summary.window.rewardedBaseUnits).toBe('350000000');
    expect(summary.allTime).toBeNull();
  });

  it('keeps u64/u128 earnings exact through service state and display adapters', async () => {
    const u64Max = '18446744073709551615';
    const u128Max = '340282366920938463463374607431768211455';
    server.use(
      http.get('https://api.test/stations/ws-1/earnings', () =>
        HttpResponse.json({ earnings: [
          evidenceRow('f1', u64Max, '2026-03-01T01:00:00.000Z'),
          evidenceRow('f2', u128Max, '2026-03-01T02:00:00.000Z'),
        ], source: 'core4', window: { commits: 2, complete: true, scope: 'recent-observations' },
        totals: { rewardedCommits: 2, unknownCommits: 0, rewardedBaseUnits: (BigInt(u64Max) + BigInt(u128Max)).toString(), rewardedWrf: '-', note: 'sum over the recent window only, not a lifetime total' } }),
      ),
    );

    const earningsService = new EarningsService(baseUrls);
    const history = await earningsService.getStationHistory('ws-1');
    const summary = await earningsService.getStationSummary('ws-1');

    expect(history.map((entry) => entry.amount)).toEqual([u64Max, u128Max]);
    expect(summary.window.rewardedBaseUnits).toBe((BigInt(u64Max) + BigInt(u128Max)).toString());
    expect(formatBaseUnitsToWrf(u64Max)).toBe('184,467,440,737.09551615');
    expect(toWrfNumberForChart(u128Max)).toBeNull();
  });

  it('serves governance methods including voting through MSW', async () => {
    const governanceService = new GovernanceService(baseUrls);

    const proposals = await governanceService.getProposals();
    const delegations = await governanceService.getDelegations('wrf123');
    const vote = await governanceService.castVote({
      proposalId: 'p-1',
      voterAddress: 'wrf123',
      vote: 'yes',
    });

    expect(proposals[0].id).toBe('p-1');
    expect(delegations[0]).toMatchObject({ delegator: 'wrf123', delegate: 'wrf999' });
    expect(vote.accepted).toBe(true);
  });

  it('serves wallet and validator methods through MSW', async () => {
    const walletService = new WalletService(baseUrls);
    const validatorService = new ValidatorApiService(baseUrls);

    const balance = await walletService.getBalance('wrf123');
    const txs = await walletService.getTransactions('wrf123');
    const validators = await validatorService.getValidators();
    const positions = await validatorService.getStakingPositions();
    const stats = await validatorService.getNetworkStats();

    expect(balance.balance).toBe('100');
    expect(txs[0].id).toBe('tx-1');
    expect(validators[0].id).toBe('v-1');
    expect(positions[0].id).toBe('s-1');
    expect(stats.totalStaked).toBe('100');
  });

  it('serves compute submit/status/results through MSW', async () => {
    const computeService = new ComputeService(baseUrls);

    const submit = await computeService.submitForecastTask({
      model: 'wrf',
      datasets: ['gfs'],
      computeEnvironment: 'cluster',
      validation: 'timestamp',
      resolution: 'high',
      forecastHours: 48,
      carbonOffset: false,
      academicEndorsement: false,
    });
    const status = await computeService.getTaskStatus('task-1');
    const results = await computeService.getTaskResults('task-1');

    expect(submit.taskId).toBe('task-1');
    expect(status.status).toBe('running');
    expect(results.outputCid).toBe('bafy-output');
    expect(results.verificationReportCid).toBe('bafy-verify');
  });
});
