/** @jest-environment jsdom */
/**
 * Bring-your-own-key Wolfram check (owner ruling 2026-11-01). The AppID lives in this browser only and
 * leaves it only in the body of the person's own check; nothing is requested until they press the button.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const { default: ReadingUnusualCheck } = await import('../ReadingUnusualCheck');
const svc = await import('../../../services/wolframReadingCheck');

const APPID = 'ABC123-DEF456GHIJ7';
const ALIAS = 'st_0123456789ab';
const READING = { stationAlias: ALIAS, observedAt: '2026-10-31T23:43:20.000Z', temperatureC: 15.2 };
const STATIONS = { stations: [{ alias: 'st_ffffffffffff', latitude: 1, longitude: 2 }, { alias: ALIAS, latitude: 46.83, longitude: -92.04 }] };
const ANSWER = {
  verdict: 'unusual',
  temperatureC: 15.2,
  place: { latitude: 46.8, longitude: -92 },
  reference: { typicalLowC: -1, typicalHighC: 9, recordLowC: -12, recordHighC: 22, averageC: null },
  pod: { title: 'Historical temperatures for October 31', text: 'average low: -1 °C | average high: 9 °C' },
  query: 'historical temperatures on October 31 at 46.8°N 92.0°W',
  resultsUrl: 'https://www.wolframalpha.com/input?i=historical%20temperatures',
  attribution: 'Wolfram|Alpha',
};

function reply(status, body, headers = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: name => headers[name] ?? null },
    json: () => Promise.resolve(body),
  });
}

function routeFetch(checkReply) {
  return jest.fn((url, init = {}) => {
    if (String(url).endsWith('/weather/stations')) return reply(200, STATIONS);
    if (String(url).endsWith('/integrations/wolfram/reading-check')) return checkReply(init);
    return reply(404, {});
  });
}

beforeEach(() => globalThis.localStorage.clear());
afterEach(cleanup);

describe('ReadingUnusualCheck', () => {
  it('asks for an AppID first and requests nothing until one is saved and the button is pressed', async () => {
    globalThis.fetch = routeFetch(() => reply(200, ANSWER));
    render(<ReadingUnusualCheck {...READING} />);
    expect(screen.getByRole('heading', { name: 'Is this reading unusual?' })).toBeInTheDocument();
    expect(screen.getByLabelText('Add your Wolfram AppID')).toHaveAttribute('type', 'password');
    expect(screen.getByText(/never stored on our servers/)).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Add your Wolfram AppID'), { target: { value: 'not a key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save on this device' }));
    expect(screen.getByRole('alert')).toHaveTextContent('does not look like');
    expect(globalThis.localStorage.getItem(svc.WOLFRAM_APPID_STORAGE_KEY)).toBeNull();

    fireEvent.change(screen.getByLabelText('Add your Wolfram AppID'), { target: { value: `  ${APPID} ` } });
    fireEvent.click(screen.getByRole('button', { name: 'Save on this device' }));
    expect(globalThis.localStorage.getItem(svc.WOLFRAM_APPID_STORAGE_KEY)).toBe(APPID);
    expect(screen.getByText('••••HIJ7')).toBeInTheDocument();
    expect(screen.queryByText(APPID)).toBeNull(); // the whole key is never on screen
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('sends one POST with the saved AppID in the JSON body (never the URL) and shows the verdict with the attribution link', async () => {
    globalThis.localStorage.setItem(svc.WOLFRAM_APPID_STORAGE_KEY, APPID);
    globalThis.fetch = routeFetch(() => reply(200, ANSWER));
    render(<ReadingUnusualCheck {...READING} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check with Wolfram|Alpha' }));

    await waitFor(() => expect(screen.getByTestId('wolfram-answer')).toBeInTheDocument());
    expect(screen.getByText('Unusual: outside the usual range for this day')).toBeInTheDocument();
    expect(screen.getByText('-1.0 °C to 9.0 °C')).toBeInTheDocument();
    expect(screen.getByText('-12.0 °C to 22.0 °C')).toBeInTheDocument();
    expect(screen.getByTestId('wolfram-results-link')).toHaveAttribute('href', ANSWER.resultsUrl);
    expect(screen.getByText(/Not a certified source/)).toBeInTheDocument();

    const calls = globalThis.fetch.mock.calls;
    expect(calls.map(([url]) => url)).toEqual(['/api/weather/stations', '/api/integrations/wolfram/reading-check']);
    const [url, init] = calls[1];
    expect(url).not.toContain(APPID);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.credentials).toBe('omit');
    expect(JSON.parse(init.body)).toEqual({ appId: APPID, latitude: 46.8, longitude: -92, date: '2026-10-31', temperatureC: 15.2 });
  });

  it('never renders a results link that is not a Wolfram|Alpha results page', async () => {
    globalThis.localStorage.setItem(svc.WOLFRAM_APPID_STORAGE_KEY, APPID);
    globalThis.fetch = routeFetch(() => reply(200, { ...ANSWER, verdict: 'typical', resultsUrl: 'javascript:alert(1)' }));
    render(<ReadingUnusualCheck {...READING} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check with Wolfram|Alpha' }));
    await waitFor(() => expect(screen.getByText('Typical for this place and day')).toBeInTheDocument());
    expect(screen.queryByTestId('wolfram-results-link')).toBeNull();
  });

  it.each([
    [404, 'not switched on for this server'],
    [401, 'did not accept this AppID'],
    [429, 'limit was reached'],
    [503, 'busy right now'],
    [502, 'could not be reached'],
  ])('says what happened on %s, never a verdict', async (status, text) => {
    globalThis.localStorage.setItem(svc.WOLFRAM_APPID_STORAGE_KEY, APPID);
    globalThis.fetch = routeFetch(() => reply(status, { success: false }));
    render(<ReadingUnusualCheck {...READING} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check with Wolfram|Alpha' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(text));
    expect(screen.queryByTestId('wolfram-answer')).toBeNull();
  });

  it('does not ask Wolfram when the station has no public location', async () => {
    globalThis.localStorage.setItem(svc.WOLFRAM_APPID_STORAGE_KEY, APPID);
    globalThis.fetch = routeFetch(() => reply(200, ANSWER));
    render(<ReadingUnusualCheck {...READING} stationAlias="st_aaaaaaaaaaaa" />);
    fireEvent.click(screen.getByRole('button', { name: 'Check with Wolfram|Alpha' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('no public location'));
    expect(globalThis.fetch.mock.calls.map(([url]) => url)).toEqual(['/api/weather/stations']);
  });

  it('forgets the AppID from this device', () => {
    globalThis.localStorage.setItem(svc.WOLFRAM_APPID_STORAGE_KEY, APPID);
    render(<ReadingUnusualCheck {...READING} />);
    fireEvent.click(screen.getByRole('button', { name: 'Forget it' }));
    expect(globalThis.localStorage.getItem(svc.WOLFRAM_APPID_STORAGE_KEY)).toBeNull();
    expect(screen.getByLabelText('Add your Wolfram AppID')).toBeInTheDocument();
  });

  it('renders nothing without a temperature to compare', () => {
    const { container } = render(<ReadingUnusualCheck {...READING} temperatureC={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('wolframReadingCheck service', () => {
  it('builds only the body the backend reads, coarsened to 0.1 degree', () => {
    expect(svc.readingCheckBody({ appId: APPID, latitude: -33.8688, longitude: 151.2093, observedAt: '2026-02-28T23:59:59Z', temperatureC: 30 }))
      .toEqual({ appId: APPID, latitude: -33.9, longitude: 151.2, date: '2026-02-28', temperatureC: 30 });
    expect(svc.readingCheckBody({ appId: 'bad', latitude: 1, longitude: 1, observedAt: '2026-02-28T00:00:00Z', temperatureC: 1 })).toBeNull();
    expect(svc.readingCheckBody({ appId: APPID, latitude: 1, longitude: 1, observedAt: 'never', temperatureC: 1 })).toBeNull();
  });

  it('tolerates storage that throws (private mode)', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    expect(svc.getStoredAppId()).toBeNull();
    spy.mockRestore();
    const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(svc.storeAppId(APPID)).toBe(false);
    set.mockRestore();
  });
});
