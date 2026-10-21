/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_URL: string;
  readonly VITE_WEATHER_API_BASE_URL?: string;
  readonly VITE_EARNINGS_API_BASE_URL?: string;
  readonly VITE_GOVERNANCE_API_BASE_URL?: string;
  readonly VITE_COMPUTE_API_BASE_URL?: string;
  readonly VITE_VALIDATOR_API_BASE_URL?: string;
  readonly VITE_WALLET_API_BASE_URL?: string;
  readonly VITE_WS_URL: string;
  readonly VITE_CROSS_CHAIN_URL: string;
  readonly VITE_WALLET_URL: string;
  readonly VITE_RAMP_API_KEY?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
