export const sanitizeAddressRecord = addressRecord => {
  if (!addressRecord || typeof addressRecord !== 'object') {
    return null;
  }

  const { privateKey, ...publicMetadata } = addressRecord;
  return publicMetadata;
};

export const sanitizeAddressRecords = records => {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.map(sanitizeAddressRecord).filter(Boolean);
};
