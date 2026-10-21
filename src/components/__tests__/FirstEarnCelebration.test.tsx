/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FirstEarnCelebration from '../Weather/FirstEarnCelebration';
import type { EarningsHistoryEntry } from '../../services/apiClient/types';

// WHY THESE FIXTURES CHANGED (frontend#269)
//
// They used to pass `{ id, amount: 0.5 }` — a fractional NUMBER, and missing
// three required fields. `EarningsHistoryEntry.amount` is a `string` of BASE
// UNITS (WRF_UNITS_PER_COIN = 10^8), and since #267 the component reads it via
// `toBaseUnits`, which returns null for anything that is not a safe integer or
// an integer string. So `toBaseUnits(0.5)` was null, `firstEarn` was null, the
// component returned null, and three of these tests failed against an empty DOM.
//
// The other two "passed" — vacuously. Both assert the dialog is ABSENT, and a
// component rendering nothing at all satisfies that for the wrong reason. They
// only begin testing anything once the fixtures are valid, which is why this
// file is repaired rather than deleted, and why each behaviour below is
// mutation-checked in the PR rather than inferred from a green run.
const wrf = (baseUnits: string, id: string): EarningsHistoryEntry => ({
  id,
  stationId: 'station-1',
  timestamp: '2026-01-01T00:00:00Z',
  amount: baseUnits, // base units: '50000000' === 0.5 WRF
  rewardType: 'weather',
});

describe('FirstEarnCelebration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens on the first positive earn and shows that earn’s amount', () => {
    render(
      <FirstEarnCelebration
        stationId="station-1"
        stationName="Station One"
        history={[wrf('50000000', 'entry-1'), wrf('240000000', 'entry-2')]}
      />,
    );

    expect(screen.getByText('Your station is earning WRF')).toBeInTheDocument();
    // Assert the AMOUNT, not just the title. A title-only assertion passes for
    // any dialog that opens — including one showing the wrong entry, or the
    // literal string 'Unavailable' that formatExactAmount returns on a parse
    // failure. 0.5 WRF is entry-1: the FIRST positive earn, not the largest and
    // not the last, which is the selection rule this test claims to cover.
    expect(screen.getByText(/0\.5000/)).toBeInTheDocument();
    expect(screen.queryByText(/2\.4000/)).not.toBeInTheDocument();
  });

  it('does not open again for a previously dismissed first earn', () => {
    localStorage.setItem('wrfcoin:first-earned:station-1', 'entry-2');

    render(
      <FirstEarnCelebration
        stationId="station-1"
        stationName="Station One"
        history={[wrf('50000000', 'entry-1'), wrf('240000000', 'entry-2')]}
      />,
    );

    expect(screen.queryByText('Your station is earning WRF')).not.toBeInTheDocument();
  });

  it('persists first-earner dismissal keyed by station id', async () => {
    render(
      <FirstEarnCelebration
        stationId="station-1"
        stationName="Station One"
        history={[wrf('120000000', 'entry-1'), wrf('380000000', 'entry-2')]}
      />,
    );

    fireEvent.click(screen.getByText('Not now'));

    expect(localStorage.getItem('wrfcoin:first-earned:station-1')).toBe('entry-1');
    // MUI Dialog keeps its content mounted through the exit transition, so the
    // close is asserted with waitFor rather than synchronously.
    await waitFor(() =>
      expect(screen.queryByText('Your station is earning WRF')).not.toBeInTheDocument(),
    );
  });

  // Tony's ruling: the celebration is ONCE PER STATION, not once per user --
  // "a user should be celebrated for each piece of equipment they bring onboard".
  // The second station is the case that distinguishes the two readings, so both
  // of these pass a walletAddress; without one the readings agree and the test
  // would prove nothing.
  it('still celebrates a second station after the first was dismissed', async () => {
    // Dismiss for real on station A, so whatever key the component writes is the
    // key it will read back -- seeding a key by hand would presuppose the answer.
    const { unmount } = render(
      <FirstEarnCelebration
        stationId="station-A"
        stationName="Station A"
        walletAddress="0xowner"
        history={[{ ...wrf('120000000', 'entry-1'), stationId: 'station-A' }]}
      />,
    );
    fireEvent.click(screen.getByText('Not now'));
    await waitFor(() =>
      expect(screen.queryByText('Your station is earning WRF')).not.toBeInTheDocument(),
    );
    unmount();

    render(
      <FirstEarnCelebration
        stationId="station-B"
        stationName="Station B"
        walletAddress="0xowner"
        history={[{ ...wrf('250000000', 'entry-9'), stationId: 'station-B' }]}
      />,
    );

    expect(screen.getByText('Your station is earning WRF')).toBeInTheDocument();
  });

  it('does not celebrate again for a station that already celebrated', async () => {
    localStorage.setItem('wrfcoin:first-earned:station-A', 'entry-1');

    render(
      <FirstEarnCelebration
        stationId="station-A"
        stationName="Station A"
        walletAddress="0xowner"
        history={[{ ...wrf('400000000', 'entry-2'), stationId: 'station-A' }]}
      />,
    );

    expect(screen.queryByText('Your station is earning WRF')).not.toBeInTheDocument();
  });

  // Guards the defect that made this file red in the first place.
  //
  // A zero-amount history must not celebrate — and the component must reach that
  // conclusion by EVALUATING the amount, not by failing to parse it. Without
  // this case, a future change that reintroduces a parse failure would turn
  // every negative assertion above back into a vacuous pass, silently, because
  // they would all still be green.
  //
  // Paired with the positive-amount assertion in the first test, the two
  // together pin the boundary: '0' must not open, '50000000' must.
  it('does not celebrate when no earn is positive', () => {
    render(
      <FirstEarnCelebration
        stationId="station-1"
        stationName="Station One"
        history={[wrf('0', 'entry-1')]}
      />,
    );

    expect(screen.queryByText('Your station is earning WRF')).not.toBeInTheDocument();
  });
});
