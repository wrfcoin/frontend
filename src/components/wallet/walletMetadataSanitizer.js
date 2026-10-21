const SECRET_WALLET_FIELDS = new Set([
  'mnemonic',
  'mnemonicPhrase',
  'privateKey',
  'password',
  'confirmPassword',
  'recoveryPhrase',
  'seed',
]);

export const sanitizeWalletDataForStorage = ({
  walletInfo,
  isEncrypted = false,
  createdAt = new Date().toISOString(),
}) => {
  const sanitizeValue = value => {
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item));
    }

    if (value && typeof value === 'object') {
      return Object.entries(value).reduce((acc, [key, nestedValue]) => {
        if (SECRET_WALLET_FIELDS.has(key) || nestedValue === undefined) {
          return acc;
        }

        acc[key] = sanitizeValue(nestedValue);
        return acc;
      }, {});
    }

    return value;
  };

  const sanitizedWallet = sanitizeValue(walletInfo || {});

  return {
    ...sanitizedWallet,
    encrypted: Boolean(isEncrypted),
    balance: 0,
    created: createdAt,
  };
};
