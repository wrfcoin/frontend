// @cohesion: ForecastViewer/types.ts — hand-written UI types for the forecast viewer.
// ForecastAccuracyMetrics is imported from @wrfcoin/generated-types (ts-rs output from
// forecast-score Rust crate). ModelScorecardEntry extends it with per-model UI metadata.
// All other types in this file are frontend-only with no generated equivalent.
import type { ForecastAccuracyMetrics } from '@wrfcoin/generated-types';
export type { ForecastAccuracyMetrics };

/** Forecast time horizons available for selection */
export type ForecastHorizon = '1h' | '6h' | '12h' | '24h' | '3d' | '7d' | '14d';

/** Weather parameters that can be visualized */
export type WeatherParameter =
  | 'temperature'
  | 'precipitation'
  | 'windSpeed'
  | 'pressure'
  | 'humidity'
  | 'cloudCover';

/** Single forecast data point at a specific time */
export interface ForecastPoint {
  timestamp: string;
  temperature: number;
  precipitation: number;
  precipitationType: 'rain' | 'snow' | 'mixed' | 'none';
  precipitationProbability: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  humidity: number;
  cloudCover: number;
}

/** An individual model's forecast trace */
export interface ModelForecast {
  modelId: string;
  modelName: string;
  color: string;
  points: ForecastPoint[];
}

/** Confidence band percentile data for a single timestamp */
export interface ConfidenceBand {
  timestamp: string;
  mean: number;
  p25: number;
  p75: number;
  p10: number;
  p90: number;
  p2_5: number;
  p97_5: number;
}

/** Full ensemble forecast containing all models and confidence data */
export interface EnsembleForecast {
  locationName: string;
  latitude: number;
  longitude: number;
  generatedAt: string;
  horizon: ForecastHorizon;
  models: ModelForecast[];
  confidence: {
    temperature: ConfidenceBand[];
    precipitation: ConfidenceBand[];
    windSpeed: ConfidenceBand[];
    pressure: ConfidenceBand[];
    humidity: ConfidenceBand[];
    cloudCover: ConfidenceBand[];
  };
}

/** Model accuracy metrics for the scorecard.
 * Core accuracy fields (mae, rmse, bias) align with ForecastAccuracyMetrics from
 * @wrfcoin/generated-types. wrfcoinScore is equivalent to ForecastAccuracyMetrics.skill_score.
 */
export interface ModelScorecardEntry {
  modelId: string;
  modelName: string;
  color: string;
  rmse: ForecastAccuracyMetrics['rmse'];
  mae: ForecastAccuracyMetrics['mae'];
  bias: ForecastAccuracyMetrics['bias'];
  wrfcoinScore: ForecastAccuracyMetrics['skill_score'];
  rmseTrend: number[];
  maeTrend: number[];
  biasTrend: number[];
  scoreTrend: number[];
}

/** Data for a single parameter panel row */
export interface ParameterPanelData {
  parameter: WeatherParameter;
  label: string;
  unit: string;
  color: string;
  data: { timestamp: string; value: number; extra?: Record<string, number | string> }[];
  yMin?: number;
  yMax?: number;
}

/** View mode for the main forecast display */
export type ViewMode = 'spaghetti' | 'confidence';

/** Model color mapping */
export const MODEL_COLORS: Record<string, string> = {
  wrfcoin_ml: '#3B82F6',
  gfs: '#10B981',
  ecmwf: '#F59E0B',
  nam: '#8B5CF6',
  hrrr: '#06B6D4',
};

/** Model display names */
export const MODEL_NAMES: Record<string, string> = {
  wrfcoin_ml: 'WRFCoin ML',
  gfs: 'GFS',
  ecmwf: 'ECMWF',
  nam: 'NAM',
  hrrr: 'HRRR',
};

/** Parameter display config */
export const PARAMETER_CONFIG: Record<
  WeatherParameter,
  { label: string; unit: string; color: string }
> = {
  temperature: { label: 'Temperature', unit: '\u00B0F', color: '#EF4444' },
  precipitation: { label: 'Precipitation', unit: '%', color: '#3B82F6' },
  windSpeed: { label: 'Wind Speed', unit: 'mph', color: '#8B5CF6' },
  pressure: { label: 'Pressure', unit: 'hPa', color: '#10B981' },
  humidity: { label: 'Humidity', unit: '%', color: '#06B6D4' },
  cloudCover: { label: 'Cloud Cover', unit: '%', color: '#6B7280' },
};
