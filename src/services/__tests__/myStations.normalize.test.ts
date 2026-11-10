// normalizeMyStations: the "my stations" list is validated fail-closed. Made-up aliases only.
import { normalizeMyStations } from '../apiClient/stationRegistrationService';

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
