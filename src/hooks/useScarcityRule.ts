import { useEffect, useState } from 'react';

/**
 * The data-scarcity rule the chain pays (core4#28, ADR 2026-10-23-3563, owner answer A1).
 *
 * `/api/weather/coverage-zones` is the backend's proxy of core4 `GET /network/scarcity`: the
 * bonus computed by the payout's own function over the on-chain station counts. Nothing about
 * the rule is defined here. A response that is not exactly that shape, or that carries a
 * multiplier the chain cannot pay, is "unavailable" and never replaced by a remembered rule.
 */
export const SCARCITY_ENDPOINT = '/api/weather/coverage-zones';

const REQUEST_TIMEOUT_MS = 8000;
/** Desert bonus and hyper-local accuracy bonus compose up to this combined cap (core4 hyper_local.rs). */
const MAX_MULTIPLIER = 2;

export interface ScarcityRule {
  gridKm: number;
  cellSizeDegrees: number;
  minStationDensity: number;
  desertBonusMultiplier: number;
  baselineMultiplier: number;
  activationHeight: number;
  active: boolean;
}

export interface ScarcityZone {
  lat: number;
  lng: number;
  rewardMultiplier: number;
  stationCount: number;
}

export interface ScarcityRuleView {
  rule: ScarcityRule;
  zones: ScarcityZone[];
  observedAtHeight: number;
}

export type ScarcityRuleState =
  | { state: 'loading' }
  | { state: 'unavailable' }
  | ({ state: 'ready' } & ScarcityRuleView);

const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;

const asRecord = (v: unknown): Record<string, unknown> | null =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

/** Strictly parse the backend body; null when any part is malformed. */
export function parseCoverageRule(payload: unknown): ScarcityRuleView | null {
  const body = asRecord(payload);
  const rule = asRecord(body?.rule);
  if (!body || !rule || !Array.isArray(body.zones) || !isCount(body.observedAtHeight)) return null;
  if (
    !isNum(rule.gridKm, 1, 255) ||
    !isNum(rule.cellSizeDegrees, 0.01, 90) ||
    !isCount(rule.minStationDensity) ||
    !isNum(rule.desertBonusMultiplier, 1, MAX_MULTIPLIER) ||
    !isNum(rule.baselineMultiplier, 1, 1) ||
    !isCount(rule.activationHeight) ||
    typeof rule.active !== 'boolean'
  ) {
    return null;
  }
  const zones: ScarcityZone[] = [];
  for (const entry of body.zones) {
    const z = asRecord(entry);
    if (
      !z ||
      !isNum(z.lat, -90, 90) ||
      !isNum(z.lng, -180, 180) ||
      !isNum(z.rewardMultiplier, 1, MAX_MULTIPLIER) ||
      !isCount(z.stationCount)
    ) {
      return null;
    }
    zones.push({ lat: z.lat, lng: z.lng, rewardMultiplier: z.rewardMultiplier, stationCount: z.stationCount });
  }
  return {
    rule: {
      gridKm: rule.gridKm,
      cellSizeDegrees: rule.cellSizeDegrees,
      minStationDensity: rule.minStationDensity,
      desertBonusMultiplier: rule.desertBonusMultiplier,
      baselineMultiplier: rule.baselineMultiplier,
      activationHeight: rule.activationHeight,
      active: rule.active,
    },
    zones,
    observedAtHeight: body.observedAtHeight,
  };
}

export function useScarcityRule(): ScarcityRuleState {
  const [result, setResult] = useState<ScarcityRuleState>({ state: 'loading' });

  useEffect(() => {
    const controller = new globalThis.AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let active = true;

    fetch(SCARCITY_ENDPOINT, {
      method: 'GET',
      signal: controller.signal,
      // Anonymous public read: no cookies, no auth header.
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    })
      .then(async response => {
        if (!response.ok) throw new Error(`${SCARCITY_ENDPOINT} responded ${response.status}`);
        const view = parseCoverageRule(await response.json());
        if (!view) throw new Error('malformed scarcity body');
        return view;
      })
      .then(view => active && setResult({ state: 'ready', ...view }))
      .catch(() => active && setResult({ state: 'unavailable' }))
      .finally(() => clearTimeout(timer));

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return result;
}
