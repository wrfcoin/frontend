// normalizeMyStations: the "my stations" list is validated fail-closed. Made-up aliases only.
import { normalizeMyStations } from '../apiClient/stationRegistrationService';
import { ownsServerStation } from '../myStationsCheck';

describe('normalizeMyStations', () => {
  it('keeps well-formed rows and drops anything without a public alias', () => {
    const list = normalizeMyStations({
      success: true,
      stations: [
        { alias: 'st_0123456789ab', name: ' Garden ', status: 'live', lastReadingAt: '2026-11-10T12:00:00.000Z', onChain: { state: 'earning' } },
        { alias: 'pws-00000000000000a1', name: 'raw id' },
        { alias: 'st_XYZ', name: 'bad alias' },
        null,
        { alias: 'st_ba9876543210', name: '', status: 'weird', lastReadingAt: 'not a date', onChain: { state: 'nope' } },
        { alias: 'st_aaaaaaaaaaaa', name: 'No chain field' },
      ],
      truncated: true,
    });
    expect(list.truncated).toBe(true);
    expect(list.passkeyLater).toBe(false);
    expect(list.dropped).toBe(3);
    expect(list.stations).toEqual([
      { alias: 'st_0123456789ab', name: 'Garden', status: 'live', lastReadingAt: '2026-11-10T12:00:00.000Z', onChain: { state: 'earning' } },
      { alias: 'st_ba9876543210', name: 'Weather station st_ba9876543210', status: null, lastReadingAt: null, onChain: null },
      { alias: 'st_aaaaaaaaaaaa', name: 'No chain field', status: null, lastReadingAt: null },
    ]);
  });

  it('the passkey-later answer is carried', () => {
    expect(normalizeMyStations({ stations: [], truncated: false, passkey: 'later' }).passkeyLater).toBe(true);
  });

  it('a body without a station array is refused', () => {
    expect(() => normalizeMyStations({ error: 'x' })).toThrow();
    expect(() => normalizeMyStations(null)).toThrow();
  });
});

describe('ownsServerStation (the wallet-removal check)', () => {
  const base = { stations: [], truncated: false, passkeyLater: false, dropped: 0 };
  const row = { alias: 'st_0123456789ab', name: 'Garden', status: null, lastReadingAt: null };

  it('a complete empty list is "no station"; any station is "owns one"', () => {
    expect(ownsServerStation(base)).toBe(false);
    expect(ownsServerStation({ ...base, stations: [row] })).toBe(true);
    expect(ownsServerStation({ ...base, stations: [row], dropped: 2 })).toBe(true);
  });

  it('a passkey-later reply, dropped rows or a truncated list is a failed check, never "no station"', () => {
    expect(() => ownsServerStation({ ...base, passkeyLater: true })).toThrow();
    expect(() => ownsServerStation({ ...base, dropped: 1 })).toThrow();
    expect(() => ownsServerStation({ ...base, truncated: true })).toThrow();
    expect(() => ownsServerStation(normalizeMyStations({ stations: [{ alias: 'pws-raw' }] }))).toThrow();
    expect(() => ownsServerStation(normalizeMyStations({ stations: [], passkey: 'later' }))).toThrow();
  });
});
