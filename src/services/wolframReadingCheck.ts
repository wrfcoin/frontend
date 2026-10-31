import { API_BASE_URL } from './config';

/**
 * Bring-your-own-key Wolfram|Alpha check (owner ruling 2026-11-01): "Is this reading unusual?".
 *
 * The person's own Wolfram|Alpha AppID is kept in THIS browser only (localStorage) and is sent only
 * with their own check, in the JSON body of one POST to wrfcoin.com, which relays it to Wolfram|Alpha
 * for that one request and never stores or logs it (backend wolfram-reading-check-routes.ts). The
 * browser cannot call Wolfram|Alpha directly: its API answers without an Access-Control-Allow-Origin
 * header, and the site's CSP allows connections to this origin only.
 *
 * The request carries numbers only (a 0.1-degree place, a calendar day, a temperature): the backend
 * writes the one question it asks, so the key cannot be used through this path for anything else.
 */

export const WOLFRAM_APPID_STORAGE_KEY = 'wrfcoin.wolfram.appId';
/** Same shape the backend accepts: a short alphanumeric id with one dash ("XXXXXX-XXXXXXXXXX"). */
export const WOLFRAM_APPID_RE = /^[A-Za-z0-9]{2,16}-[A-Za-z0-9]{4,32}$/;
export const WOLFRAM_READING_CHECK_PATH = '/integrations/wolfram/reading-check';
export const WOLFRAM_GET_APPID_URL = 'https://developer.wolframalpha.com/access';
export const WOLFRAM_TERMS_URL = 'https://products.wolframalpha.com/api/termsofuse';

/** Read the saved AppID; null when none is saved or storage is unavailable (private mode, blocked). */
export function getStoredAppId(): string | null {
  try {
    const value = globalThis.localStorage?.getItem(WOLFRAM_APPID_STORAGE_KEY) ?? null;
    return value && WOLFRAM_APPID_RE.test(value) ? value : null;
  } catch {
    return null;
  }
}

/** Save an AppID on this device. Returns false for a malformed id or when storage refuses. */
export function storeAppId(raw: string): boolean {
  const value = raw.trim();
  if (!WOLFRAM_APPID_RE.test(value)) return false;
  try {
    globalThis.localStorage?.setItem(WOLFRAM_APPID_STORAGE_KEY, value);
    return globalThis.localStorage?.getItem(WOLFRAM_APPID_STORAGE_KEY) === value;
  } catch {
    return false;
  }
}

export function forgetAppId(): void {
  try {
    globalThis.localStorage?.removeItem(WOLFRAM_APPID_STORAGE_KEY);
  } catch {
    /* storage unavailable: nothing was saved */
  }
}

/** "••••HJ7" — enough to recognise which key is saved, never the whole key on screen. */
export function maskAppId(appId: string): string {
  return `••••${appId.slice(-4)}`;
}

export type Verdict = 'typical' | 'unusual' | 'outside_record' | 'unknown';
export interface ReadingCheckAnswer {
  verdict: Verdict;
  temperatureC: number;
  place: { latitude: number; longitude: number };
  reference: {
    typicalLowC: number | null;
    typicalHighC: number | null;
    recordLowC: number | null;
    recordHighC: number | null;
    averageC: number | null;
  } | null;
  pod: { title: string; text: string } | null;
  query: string;
  resultsUrl: string;
  attribution: string;
}

export type ReadingCheckResult =
  | { kind: 'ok'; data: ReadingCheckAnswer }
  | { kind: 'off' } // 404: the check is not switched on for this server
  | { kind: 'rejected' } // Wolfram|Alpha did not accept the AppID
  | { kind: 'limited'; retryAfterSeconds: number | null } // the caller's own Wolfram quota, or this site's limit
  | { kind: 'busy'; retryAfterSeconds: number | null }
  | { kind: 'error' };

export interface ReadingCheckInput {
  appId: string;
  latitude: number;
  longitude: number;
  /** ISO time of the reading; only its UTC calendar day is sent. */
  observedAt: string;
  temperatureC: number;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** The exact body the backend reads. The place is coarsened to 0.1 degree before it leaves the device. */
export function readingCheckBody(input: ReadingCheckInput): Record<string, unknown> | null {
  const at = new Date(input.observedAt);
  if (!WOLFRAM_APPID_RE.test(input.appId) || Number.isNaN(at.getTime())) return null;
  if (![input.latitude, input.longitude, input.temperatureC].every(Number.isFinite)) return null;
  return {
    appId: input.appId,
    latitude: round1(input.latitude),
    longitude: round1(input.longitude),
    date: at.toISOString().slice(0, 10),
    temperatureC: input.temperatureC,
  };
}

const retryAfter = (response: Response): number | null => {
  const n = Number(response.headers?.get?.('Retry-After'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export async function checkReading(input: ReadingCheckInput, signal?: globalThis.AbortSignal): Promise<ReadingCheckResult> {
  const body = readingCheckBody(input);
  if (!body) return { kind: 'error' };
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${WOLFRAM_READING_CHECK_PATH}`, {
      method: 'POST',
      // Exactly `application/json`: the edge admits this route only with that header.
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      signal,
    });
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') throw error;
    return { kind: 'error' };
  }
  if (response.status === 404) return { kind: 'off' };
  if (response.status === 401) return { kind: 'rejected' };
  if (response.status === 429) return { kind: 'limited', retryAfterSeconds: retryAfter(response) };
  if (response.status === 503) return { kind: 'busy', retryAfterSeconds: retryAfter(response) };
  if (!response.ok) return { kind: 'error' };
  try {
    const data = (await response.json()) as ReadingCheckAnswer;
    return data && typeof data.verdict === 'string' && typeof data.resultsUrl === 'string' ? { kind: 'ok', data } : { kind: 'error' };
  } catch {
    return { kind: 'error' };
  }
}
