type EnvMap = Record<string, string | undefined>;

export interface ServiceBaseUrls {
  api: string;
  weather: string;
  earnings: string;
  governance: string;
  wallet: string;
  compute: string;
  validator: string;
}

function normalizeBaseUrl(value?: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
}

function readEnv(env: EnvMap, key: string): string {
  return normalizeBaseUrl(env[key]);
}

const defaultEnv = ((import.meta as unknown as { env?: EnvMap }).env ?? {}) as EnvMap;

export function resolveServiceBaseUrls(env: EnvMap = defaultEnv): ServiceBaseUrls {
  const primaryBase = readEnv(env, 'VITE_API_BASE_URL') || readEnv(env, 'VITE_API_URL') || '/api';

  return {
    api: primaryBase,
    weather: readEnv(env, 'VITE_WEATHER_API_BASE_URL') || primaryBase,
    earnings: readEnv(env, 'VITE_EARNINGS_API_BASE_URL') || readEnv(env, 'VITE_WEATHER_API_BASE_URL') || primaryBase,
    governance: readEnv(env, 'VITE_GOVERNANCE_API_BASE_URL') || primaryBase,
    wallet: readEnv(env, 'VITE_WALLET_API_BASE_URL') || primaryBase,
    compute: readEnv(env, 'VITE_COMPUTE_API_BASE_URL') || primaryBase,
    validator: readEnv(env, 'VITE_VALIDATOR_API_BASE_URL') || readEnv(env, 'VITE_GOVERNANCE_API_BASE_URL') || primaryBase,
  };
}
