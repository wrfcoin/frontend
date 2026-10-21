import type {
  EarningsBreakdownEntry,
  EarningsHistoryEntry,
  EarningsSummary,
  EarningsWindow,
  RewardEvidenceEntry,
  StationLifetime,
  StationRate,
} from './types';
import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { requireExactBaseUnits } from './number';

export class EarningsService {
  private readonly client: ApiClient;

  constructor(baseUrls: ServiceBaseUrls) {
    this.client = new ApiClient({ baseUrl: baseUrls.earnings });
  }

  /**
   * The backend's station earnings: the reward evidence of the station's
   * recent observations (backend station-detail-routes.ts, core4 source).
   * Rows are { commitId, rewarded, amountBaseUnits, amountWrf, blocker,
   * finalized, height, blockTimestamp }; totals cover that window only and
   * are not a lifetime total.
   */
  async getStationRewardEvidence(
    stationId: string,
  ): Promise<{ entries: RewardEvidenceEntry[]; window: EarningsWindow }> {
    const { entries, window } = await this.readStationEarnings(stationId);
    return { entries, window };
  }

  private async readStationEarnings(stationId: string): Promise<{
    entries: RewardEvidenceEntry[];
    window: EarningsWindow;
    lifetime: StationLifetime | null;
    rate: StationRate | null;
  }> {
    const response = await this.client.get<unknown>(
      `/stations/${encodeURIComponent(stationId)}/earnings`,
    );
    assertEarningsAvailable(response);
    const body = response as unknown as Record<string, unknown>;
    const entries = response.earnings.map((row, index) => parseEvidenceRow(row, index));
    return {
      entries,
      window: parseWindow(body, entries),
      lifetime: parseLifetime(body.lifetime),
      rate: parseRate(body.rate),
    };
  }

  /** Proven rewards only: rewarded, with an amount and a block time. */
  async getStationHistory(stationId: string): Promise<EarningsHistoryEntry[]> {
    const { entries } = await this.getStationRewardEvidence(stationId);
    return entries
      .filter((entry) => entry.rewarded === true && entry.amountBaseUnits !== null && entry.blockTimestamp !== null)
      .map((entry) => ({
        id: entry.commitId,
        stationId,
        timestamp: entry.blockTimestamp as string,
        amount: entry.amountBaseUnits as string,
        rewardType: entry.finalized ? 'Reward' : 'Reward (not yet final)',
      }));
  }

  /**
   * Totals from the recent window: today / this week / this month count the
   * proven rewards with a block time inside each period. There is no
   * lifetime total from the window; `lifetime` and `rate` come from the backend's own fields
   * (backend#1232) and are null whenever the backend could not prove them.
   */
  async getStationSummary(stationId: string): Promise<EarningsSummary> {
    const { entries, window, lifetime, rate } = await this.readStationEarnings(stationId);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const totals = { today: 0n, thisWeek: 0n, thisMonth: 0n };
    for (const entry of entries) {
      if (entry.rewarded !== true || entry.amountBaseUnits === null || entry.blockTimestamp === null) continue;
      const age = now - Date.parse(entry.blockTimestamp);
      const units = BigInt(entry.amountBaseUnits);
      if (age <= 30 * oneDay) totals.thisMonth += units;
      if (age <= 7 * oneDay) totals.thisWeek += units;
      if (age <= oneDay) totals.today += units;
    }
    return {
      stationId,
      today: totals.today.toString(),
      thisWeek: totals.thisWeek.toString(),
      thisMonth: totals.thisMonth.toString(),
      // Only a lifetime the backend proved to be this station's alone is "all time" for it.
      allTime: lifetime?.scope === 'station' ? lifetime.baseUnits : null,
      currentRate: null,
      lifetime,
      rate,
      window,
    };
  }

  /**
   * A per-period breakdown into base reward and bonuses. The backend has no
   * such breakdown (its earnings are per-observation reward evidence), so this
   * reports unavailable instead of inventing one.
   */
  async getStationEarnings(
    stationId: string,
    _options: {
      period?: 'hourly' | 'daily' | 'weekly' | 'monthly';
      startDate?: number;
      endDate?: number;
      limit?: number;
    } = {},
  ): Promise<EarningsBreakdownEntry[]> {
    throw new StationEarningsUnavailableError(
      `a per-period reward breakdown is not available on this testnet (station ${stationId})`,
    );
  }
}

const HASH_RE = /^(0x)?[0-9a-fA-F]{64}$/;
const BLOCKER_RE = /^[a-z_]{1,64}$/;

function parseEvidenceRow(value: unknown, index: number): RewardEvidenceEntry {
  if (!value || typeof value !== 'object') throw new Error(`earning ${index} is unavailable`);
  const row = value as Record<string, unknown>;
  if (typeof row.commitId !== 'string' || !HASH_RE.test(row.commitId)) {
    throw new Error(`earning ${index} commitId is invalid`);
  }
  const rewarded = row.rewarded === true ? true : row.rewarded === false ? false : row.rewarded === null ? null : undefined;
  if (rewarded === undefined) throw new Error(`earning ${index} rewarded is invalid`);
  const amountBaseUnits = row.amountBaseUnits === null || row.amountBaseUnits === undefined
    ? null
    : requireExactBaseUnits(row.amountBaseUnits, `earning ${index} amountBaseUnits`);
  // A reward is a non-negative integer (the backend sends /^\d{1,39}$/).
  if (amountBaseUnits !== null && !/^\d{1,39}$/.test(amountBaseUnits)) {
    throw new Error(`earning ${index} amountBaseUnits must be a non-negative integer base-unit string`);
  }
  const blockTimestamp = typeof row.blockTimestamp === 'string' && Number.isFinite(Date.parse(row.blockTimestamp))
    ? row.blockTimestamp
    : null;
  return {
    commitId: row.commitId,
    rewarded,
    // An amount is meaningful only for a proven reward.
    amountBaseUnits: rewarded === true ? amountBaseUnits : null,
    blocker: typeof row.blocker === 'string' && BLOCKER_RE.test(row.blocker) ? row.blocker : null,
    finalized: typeof row.finalized === 'boolean' ? row.finalized : null,
    height: typeof row.height === 'number' && Number.isSafeInteger(row.height) && row.height >= 0 ? row.height : null,
    blockTimestamp,
  };
}

const BASE_UNITS_RE = /^\d{1,39}$/;

/** The backend's additive `lifetime`: anything absent, null or malformed is unavailable (null), never 0. */
function parseLifetime(value: unknown): StationLifetime | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.baseUnits !== 'string' || !BASE_UNITS_RE.test(v.baseUnits)) return null;
  if (v.scope === 'station') return { scope: 'station', stationsSharingAddress: null, baseUnits: v.baseUnits };
  if (v.scope === 'address') {
    // The count is only sent to the operator or the owner wallet; anonymous bodies omit it.
    const n = v.stationsSharingAddress;
    if (n === undefined || n === null) return { scope: 'address', stationsSharingAddress: null, baseUnits: v.baseUnits };
    if (typeof n === 'number' && Number.isSafeInteger(n) && n >= 2) {
      return { scope: 'address', stationsSharingAddress: n, baseUnits: v.baseUnits };
    }
  }
  return null;
}

function parseRate(value: unknown): StationRate | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const count = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n > 0;
  if (typeof v.baseUnitsPerDay !== 'string' || !BASE_UNITS_RE.test(v.baseUnitsPerDay)
      || !count(v.windowCommits) || !count(v.windowSeconds) || v.complete !== true) return null;
  return { baseUnitsPerDay: v.baseUnitsPerDay, windowCommits: v.windowCommits, windowSeconds: v.windowSeconds };
}

function parseWindow(body: Record<string, unknown>, entries: RewardEvidenceEntry[]): EarningsWindow {
  // The backend's window and totals are summaries of the rows (station-detail-routes.ts): every
  // count and the sum must be present, well-typed and equal to what the rows themselves say.
  // A contradictory or malformed summary is refused, never displayed.
  const window = body.window;
  const totals = body.totals;
  if (!window || typeof window !== 'object' || !totals || typeof totals !== 'object') {
    throw new Error('station earnings window/totals are missing');
  }
  const w = window as Record<string, unknown>;
  const t = totals as Record<string, unknown>;
  let rewardedBaseUnits = 0n;
  let rewardedCommits = 0;
  let unknownCommits = 0;
  for (const entry of entries) {
    if (entry.rewarded === true && entry.amountBaseUnits !== null) {
      rewardedBaseUnits += BigInt(entry.amountBaseUnits);
      rewardedCommits += 1;
    }
    if (entry.rewarded === null) unknownCommits += 1;
  }
  const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
  if (!count(w.commits) || w.commits !== entries.length || typeof w.complete !== 'boolean'
      || (w.scope !== undefined && w.scope !== 'recent-observations')) {
    throw new Error('station earnings window does not match its rows');
  }
  if (!count(t.rewardedCommits) || t.rewardedCommits !== rewardedCommits
      || !count(t.unknownCommits) || t.unknownCommits !== unknownCommits
      || typeof t.rewardedBaseUnits !== 'string' || !/^\d{1,39}$/.test(t.rewardedBaseUnits)
      || BigInt(t.rewardedBaseUnits) !== rewardedBaseUnits) {
    throw new Error('station earnings totals do not match their rows');
  }
  return {
    commits: entries.length,
    complete: w.complete,
    rewardedCommits,
    unknownCommits,
    rewardedBaseUnits: rewardedBaseUnits.toString(),
  };
}

export class StationEarningsUnavailableError extends Error {
  constructor(message = 'Station earnings are not live') {
    super(message);
    this.name = 'StationEarningsUnavailableError';
  }
}

function assertEarningsAvailable(response: unknown): asserts response is { earnings: unknown[] } {
  if (!response || typeof response !== 'object') {
    throw new Error('station earnings has an invalid response shape');
  }
  const value = response as Record<string, unknown>;
  if (Array.isArray(value.unavailable) && value.unavailable.includes('earnings')) {
    throw new StationEarningsUnavailableError(typeof value.reason === 'string' ? value.reason : undefined);
  }
  if (!Array.isArray(value.earnings)) {
    throw new Error('station earnings has an invalid response shape');
  }
}




export default EarningsService;
