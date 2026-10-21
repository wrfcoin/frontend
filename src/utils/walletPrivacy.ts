const SENSITIVE_KEYS = new Set([
  'mnemonic',
  'mnemonicPhrase',
  'privateKey',
  'secretKey',
  'seed',
  'password',
  'confirmPassword',
]);

export function maskAddress(value: string | null | undefined): string {
  if (!value) return '';
  if (value.length <= 10) return '***';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function sanitizeWalletMetadata<T>(input: T): T {
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(walk);
    }
    if (!value || typeof value !== 'object') {
      return value;
    }

    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, nested]) => {
        if (SENSITIVE_KEYS.has(key)) {
          return acc;
        }
        if (key.toLowerCase().includes('address') && typeof nested === 'string') {
          acc[key] = maskAddress(nested);
          return acc;
        }
        acc[key] = walk(nested);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  };

  return walk(input) as T;
}

