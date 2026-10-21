function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, '');
}

function normalizeApiBase(value: unknown): string | undefined {
  const normalized = normalizeString(value);
  if (!normalized) return undefined;
  return normalized.replace(/\/api$/i, '');
}

function getWindowRuntimeValue(key: string): string | undefined {
  try {
    const runtime = (globalThis as any)?.__WRF_RUNTIME_CONFIG__;
    return normalizeApiBase(runtime?.[key]);
  } catch {
    return undefined;
  }
}

function getImportMetaEnvValue(key: string): string | undefined {
  try {
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    return normalizeApiBase(env?.[key]);
  } catch {
    return undefined;
  }
}

function getProcessEnvValue(key: string): string | undefined {
  try {
    if (typeof process === 'undefined' || !process.env) return undefined;
    return normalizeApiBase(process.env[key]);
  } catch {
    return undefined;
  }
}

function getWindowOriginValue(): string | undefined {
  try {
    if (typeof window === 'undefined' || !window.location?.origin) return undefined;
    return normalizeApiBase(window.location.origin);
  } catch {
    return undefined;
  }
}

export function resolveSyncApiBaseUrl(): string {
  return (
    getWindowRuntimeValue('apiBaseUrl') ||
    getWindowRuntimeValue('apiUrl') ||
    getImportMetaEnvValue('VITE_API_BASE_URL') ||
    getImportMetaEnvValue('VITE_API_URL') ||
    getProcessEnvValue('VITE_API_URL') ||
    getProcessEnvValue('VITE_API_BASE_URL') ||
    getProcessEnvValue('WRF_API_URL') ||
    getWindowOriginValue() ||
    ''
  );
}
