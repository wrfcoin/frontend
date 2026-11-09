import { publicGet, type PublicReadResult } from './publicReadonlyApi';
import { walletCall, type WalletCallResult } from './walletApi';
import type { ForecastDraft, ForecastVariable, SignedForecastCommit } from './walletCrypto/forecastCommit';

/**
 * Website forecasts (backend routes/website-forecast-routes, design 2026-11-05). Every path 404s until the
 * backend switch WEBSITE_FORECAST_ENABLED=true. Status is public; draft, submit and "mine" are calls as the
 * signed-in wallet (its login token is the only credential).
 */
export interface ForecastStatus { enabled: boolean; leads: number[]; variables: string[] }

export interface ForecastScore { status: 'pending' | 'scored' | 'unavailable'; forecast: number | null; truth: number | null; error: number | null }

/**
 * The integer practice score (backend services/forecast-score). Values are whole numbers in hundredths of the
 * display unit (`temp_c_centi` = 0.01 °C, `pressure_pa` = Pa = 0.01 hPa); `skill` is in millionths. Never paid.
 */
export interface PracticeScore {
  status: 'pending' | 'scored' | 'unscored';
  reason: 'waiting_for_reading' | 'no_reading' | 'no_baseline' | null;
  text: string;
  paid: false;
  note: string;
  unit: 'temp_c_centi' | 'pressure_pa';
  skillMax: number;
  pendingUntil?: string | null;
  giveUpAt?: string | null;
  validAt?: string | null;
  forecast?: number | null;
  truth?: number | null;
  truthObservedAt?: string | null;
  error?: number | null;
  baseline?: { error: number | null; kind: 'climatology_spread' | 'persistence_spread' | null };
  skill?: number | null;
  copied?: boolean;
  beatBaseline?: boolean;
  nws?: { source: string; forecast: number | null; error: number; skill: number | null; leadHours: number | null; result: 'you_beat_nws' | 'nws_beat_you' | 'tie' } | null;
}

export interface MyForecast {
  commitId: string;
  stationAlias: string;
  variable: ForecastVariable;
  value: number;
  leadHours: number;
  issuedAt: string;
  validAt: string;
  status: 'committing' | 'committed' | 'revealing' | 'revealed' | 'failed';
  failure: string | null;
  commitTxHash: string | null;
  revealTxHash: string | null;
  committedAtHeight: number | null;
  revealedAtHeight: number | null;
  score: ForecastScore | null;
  /** Present (possibly null) only while the backend's practice-score switch is on. */
  practiceScore?: PracticeScore | null;
}

export interface SubmitResult { commitId: string; status: string; commitTxHash: string | null; stationAlias: string; issuedAt: number; validAt: number }

export const FORECAST_STATUS_PATH = '/forecasts/status';

export const readForecastStatus = (): Promise<PublicReadResult<ForecastStatus>> => publicGet<ForecastStatus>(FORECAST_STATUS_PATH);

export const requestForecastDraft = (body: { stationAlias: string; variable: ForecastVariable; leadHours: number; value: number }): Promise<WalletCallResult<ForecastDraft>> =>
  walletCall<ForecastDraft>('POST', '/forecasts/draft', body);

export const submitForecast = (body: SignedForecastCommit): Promise<WalletCallResult<SubmitResult>> =>
  walletCall<SubmitResult>('POST', '/forecasts/submit', body);

export const readMyForecasts = (): Promise<WalletCallResult<{ forecasts: MyForecast[] }>> =>
  walletCall<{ forecasts: MyForecast[] }>('GET', '/forecasts/mine');
