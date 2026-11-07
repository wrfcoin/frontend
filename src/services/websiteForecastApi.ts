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
