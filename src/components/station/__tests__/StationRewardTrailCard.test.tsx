/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, render, screen, within } from '@testing-library/react';
import StationRewardTrailCard from '../StationRewardTrailCard';
import { furthestStage, normalizeStationRewardTrail } from '../../../utils/stationRewardTrail';

const H = (n: number) => n.toString(16).padStart(64, '0');
const done = { state: 'done' };
const notReached = { state: 'not_reached' };

const inWallet = {
  commitId: H(1), readingHeight: 461,
  trail: {
    stage: 'in_wallet', unknown: false,
    submitted: done, accepted: { state: 'done', height: 461 }, eligible: done,
    settled: { state: 'done', height: 470 }, inWallet: done,
  },
};
const waiting = {
  commitId: H(2), readingHeight: 462,
  trail: {
    stage: 'accepted', unknown: false,
    submitted: done, accepted: { state: 'done', height: 462 },
    eligible: { state: 'pending', reason: 'no_reward_record' }, settled: notReached, inWallet: notReached,
  },
};
const pruned = {
  commitId: H(3), readingHeight: 300,
  trail: {
    stage: 'eligible', unknown: true,
    submitted: done, accepted: { state: 'done', height: 300 }, eligible: done,
    settled: { state: 'unknown', reason: 'block_not_found_in_scan_window' }, inWallet: notReached,
  },
};
const body = (readings: unknown[], over: Record<string, unknown> = {}) => ({
  readings, source: 'core4', window: { readings: readings.length, complete: true, scope: 'recent-observations' }, ...over,
});

afterEach(cleanup);

describe('normalizeStationRewardTrail', () => {
  it('reads each row\'s stages and heights, newest first as sent', () => {
    const v = normalizeStationRewardTrail(body([waiting, inWallet]));
    expect(v.status).toBe('ok');
    if (v.status !== 'ok') return;
    expect(v.rows.map((r) => [r.readingHeight, furthestStage(r)])).toEqual([[462, 'accepted'], [461, 'inWallet']]);
    expect(v.rows[1].steps.settled).toEqual({ state: 'done', height: 470, reason: null });
  });

  it('an unreadable step is unknown, never done; an unknown reason code is dropped', () => {
    const v = normalizeStationRewardTrail(body([{ ...inWallet, trail: { ...inWallet.trail, settled: { state: 'paid!' }, eligible: { state: 'done', reason: 'Has <b>html</b>' } } }]));
    if (v.status !== 'ok') throw new Error('expected ok');
    expect(v.rows[0].steps.settled.state).toBe('unknown');
    expect(v.rows[0].steps.eligible.reason).toBeNull();
    expect(v.rows[0].unknown).toBe(true);
    expect(furthestStage(v.rows[0])).toBe('eligible');
  });

  it('rows without a readable trail are dropped, never given invented stages', () => {
    const noTrail: Record<string, unknown> = { ...inWallet };
    delete noTrail.trail;
    expect(normalizeStationRewardTrail(body([noTrail]))).toEqual({
      status: 'not_available', reason: 'Reading stages could not be read from this server.',
    });
    expect(normalizeStationRewardTrail(body([]))).toEqual({
      status: 'not_available', reason: 'This station has no recent readings on chain.',
    });
  });

  it('a server that could not read the chain is not available, not empty', () => {
    expect(normalizeStationRewardTrail({ readings: [], unavailable: ['readings'], source: null })).toEqual({
      status: 'not_available', reason: 'The chain could not be read just now. Try again later.',
    });
    expect(() => normalizeStationRewardTrail('nope')).toThrow();
  });
});

describe('<StationRewardTrailCard>', () => {
  it('shows each reading\'s stages with the record behind them, and no money amount', () => {
    render(<StationRewardTrailCard view={normalizeStationRewardTrail(body([waiting, inWallet, pruned]))} unavailable={false} />);
    const list = screen.getByRole('list', { name: 'Newest readings and their stages' });
    const rows = within(list).getAllByRole('listitem').filter((el) => el.tagName === 'LI');
    expect(rows).toHaveLength(3);

    expect(within(rows[0]).getByText('Reading in block #462')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Waiting for attesters to agree on this reading.')).toBeInTheDocument();
    expect(within(rows[0]).getByLabelText('Eligible: waiting')).toBeInTheDocument();
    expect(within(rows[0]).getByLabelText('In wallet: not yet')).toBeInTheDocument();

    expect(within(rows[1]).getByLabelText('Settled: done, block 470')).toBeInTheDocument();
    expect(within(rows[1]).getByText('In the owner’s wallet.')).toBeInTheDocument();

    // History out of reach is said plainly as unknown.
    expect(within(rows[2]).getByLabelText('Settled: unknown')).toBeInTheDocument();
    expect(within(rows[2]).getByText(/^Unknown: the pay block is older/)).toBeInTheDocument();

    // No blended earnings number: the card shows no WRF amount at all.
    expect(screen.queryByText(/WRF/)).not.toBeInTheDocument();
    expect(screen.getByText('Forecasts: not paid yet (future). Skill pay is not switched on on chain.')).toBeInTheDocument();
  });

  it('a failed read is said plainly, with nothing assumed', () => {
    render(<StationRewardTrailCard view={undefined} unavailable />);
    expect(screen.getByText(/Reading stages are unavailable right now/)).toBeInTheDocument();
  });

  it('shows the newest five by default', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ ...waiting, commitId: H(10 + i), readingHeight: 500 - i }));
    render(<StationRewardTrailCard view={normalizeStationRewardTrail(body(many))} unavailable={false} />);
    expect(screen.getAllByText(/^Reading in block #/)).toHaveLength(5);
  });
});
