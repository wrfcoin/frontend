/**
 * Reward trail (plan 2026-11-17-reward-trail, slice 1): parse GET /api/stations/<alias>/reward-trail
 * (backend station-detail-routes.ts rewardTrail()). Each recent reading reports the plain stages it has
 * reached: submitted, accepted, eligible, settled, in wallet.
 *
 * This parser reads only fixed enums, fixed reason codes, heights, the reading's commit id and (owner
 * ruling 2026-11-19) each reading's own reward amount on its eligible and settled steps. There is never
 * one blended "earned" sum: no total is read or shown. Anything this app cannot read becomes "unknown",
 * never "done", and an amount it cannot read is simply not shown.
 */

export type TrailState = 'done' | 'pending' | 'not_eligible' | 'unknown' | 'not_reached';
export type TrailStageKey = 'submitted' | 'accepted' | 'eligible' | 'settled' | 'inWallet';

export interface TrailStep {
  state: TrailState;
  height: number | null;
  reason: string | null;
  /** This reading's reward in WRF (display string), only on a done eligible or settled step. */
  amountWrf: string | null;
}

export interface TrailRow {
  commitId: string;
  readingHeight: number | null;
  unknown: boolean;
  steps: Record<TrailStageKey, TrailStep>;
  /** This one reading's reward (settled amount when known, else the eligible amount), or null. */
  amountWrf: string | null;
  /** True when amountWrf comes from a settled step. */
  amountSettled: boolean;
}

export type StationRewardTrailView =
  | { status: 'ok'; rows: TrailRow[]; windowComplete: boolean }
  /** The server answered but sent no trail (older backend) or no readable rows. */
  | { status: 'not_available'; reason: string };

export const TRAIL_STAGES: TrailStageKey[] = ['submitted', 'accepted', 'eligible', 'settled', 'inWallet'];

export const STAGE_LABEL: Record<TrailStageKey, string> = {
  submitted: 'Submitted',
  accepted: 'Accepted',
  eligible: 'Eligible',
  settled: 'Settled',
  inWallet: 'In wallet',
};

const STATES = new Set<string>(['done', 'pending', 'not_eligible', 'unknown', 'not_reached']);
const HASH_RE = /^(0x)?[0-9a-fA-F]{8,128}$/;
const CODE_RE = /^[a-z_]{1,64}$/;
/** A positive WRF display amount: up to 8 decimals, no sign, no exponent. */
const WRF_RE = /^(0|[1-9]\d{0,30})(\.\d{1,8})?$/;
const AMOUNT_STAGES = new Set<TrailStageKey>(['eligible', 'settled']);

/** Plain words for each reason code the backend can send. An unlisted code is shown as "unknown reason". */
export const REASON_TEXT: Record<string, string> = {
  no_reward_record: 'Waiting for attesters to agree on this reading.',
  provenance_not_reward_eligible: 'Not paid: this reading is not from a verified real station.',
  zero_amount: 'Counted, but its pay share was zero.',
  reward_not_finalized: 'Pay is decided but not final yet.',
  block_not_finalized: 'Paid in a block that is not final yet.',
  block_not_found_in_scan_window: 'Unknown: the pay block is older than the node keeps searchable.',
  block_scan_incomplete: 'Unknown: the node could not search all of its history.',
  account_missing: 'Unknown: the wallet record could not be read.',
  account_credit_short: 'Unknown: the wallet total does not cover this pay yet.',
  evidence_unavailable: 'Unknown: the chain could not be read just now.',
  reading_height_unavailable: 'Unknown: the block height was not reported.',
  unrecognised_blocker: 'Unknown: the chain reported a state this site does not know yet.',
};

export function reasonText(code: string | null): string | null {
  if (!code) return null;
  return REASON_TEXT[code] ?? 'Unknown reason.';
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const height = (v: unknown): number | null => (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null);

function amount(stage: TrailStageKey, state: TrailState, raw: unknown): string | null {
  if (!AMOUNT_STAGES.has(stage) || state !== 'done' || !isObj(raw)) return null;
  const wrf = raw.wrf;
  if (typeof wrf !== 'string' || !WRF_RE.test(wrf) || /^0(\.0+)?$/.test(wrf)) return null;
  return wrf;
}

function step(stage: TrailStageKey, raw: unknown): TrailStep {
  if (!isObj(raw) || typeof raw.state !== 'string' || !STATES.has(raw.state)) {
    return { state: 'unknown', height: null, reason: null, amountWrf: null };
  }
  const state = raw.state as TrailState;
  return {
    state,
    height: height(raw.height),
    reason: typeof raw.reason === 'string' && CODE_RE.test(raw.reason) ? raw.reason : null,
    amountWrf: amount(stage, state, raw.amount),
  };
}

export function normalizeStationRewardTrail(raw: unknown): StationRewardTrailView {
  if (!isObj(raw)) throw new Error('reward trail: unreadable response');
  if (!Array.isArray(raw.readings) || Array.isArray(raw.unavailable)) {
    // `unavailable: ['readings']`: the server could not read the chain.
    return { status: 'not_available', reason: 'The chain could not be read just now. Try again later.' };
  }
  const rows: TrailRow[] = [];
  for (const item of raw.readings) {
    if (!isObj(item) || !isObj(item.trail)) continue;
    const commitId = typeof item.commitId === 'string' && HASH_RE.test(item.commitId) ? item.commitId : null;
    if (!commitId) continue;
    const trail = item.trail;
    const steps = Object.fromEntries(TRAIL_STAGES.map((k) => [k, step(k, trail[k])])) as Record<TrailStageKey, TrailStep>;
    rows.push({
      commitId,
      readingHeight: height(item.readingHeight),
      unknown: trail.unknown === true || TRAIL_STAGES.some((k) => steps[k].state === 'unknown'),
      steps,
      amountWrf: steps.settled.amountWrf ?? steps.eligible.amountWrf,
      amountSettled: steps.settled.amountWrf !== null,
    });
  }
  if (rows.length === 0) {
    return raw.readings.length === 0
      ? { status: 'not_available', reason: 'This station has no recent readings on chain.' }
      : { status: 'not_available', reason: 'Reading stages could not be read from this server.' };
  }
  const window = isObj(raw.window) ? raw.window : {};
  return { status: 'ok', rows, windowComplete: window.complete === true };
}

/** The furthest stage with a record behind it. */
export function furthestStage(row: TrailRow): TrailStageKey {
  let last: TrailStageKey = 'submitted';
  for (const k of TRAIL_STAGES) {
    if (row.steps[k].state === 'done') last = k;
    else break;
  }
  return last;
}

/** The first stage that is not done, with its state (null when every stage is done). */
export function heldAt(row: TrailRow): { stage: TrailStageKey; step: TrailStep } | null {
  for (const k of TRAIL_STAGES) {
    if (row.steps[k].state !== 'done') return { stage: k, step: row.steps[k] };
  }
  return null;
}

export const shortId = (id: string) => {
  const hex = id.replace(/^0x/, '');
  return `${hex.slice(0, 8)}…${hex.slice(-4)}`;
};
