const wait = milliseconds =>
  new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });

export const lazyImportWithRetry = async (
  importer,
  { retries = 2, retryDelayMs = 300 } = {},
) => {
  if (typeof importer !== 'function') {
    throw new Error('lazyImportWithRetry requires an importer function');
  }

  const retryCount = Number.isFinite(retries)
    ? Math.max(0, Math.floor(retries))
    : 0;
  let lastError = null;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await importer();
    } catch (error) {
      lastError = error;

      if (attempt === retryCount) {
        break;
      }

      await wait(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError;
};
