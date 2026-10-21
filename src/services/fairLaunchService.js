const readJson = async response => {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('API returned non-JSON response');
  }
};

const buildUrl = path => {
  const base = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
};

const buildReaderHeaders = () => {
  const readerToken = import.meta.env?.VITE_READER_TOKEN;
  return readerToken ? { Authorization: `Bearer ${readerToken}` } : {};
};

export const fairLaunchService = {
  async fetchStakeStatus(address) {
    const response = await fetch(buildUrl(`/transactions/stake/${encodeURIComponent(address)}`), {
      headers: buildReaderHeaders(),
    });
    const body = await readJson(response);

    if (!response.ok) {
      const message = body?.message || body?.error || 'Failed to fetch stake status';
      throw new Error(message);
    }

    return body;
  },

  async fetchContributionStatuses() {
    const response = await fetch(buildUrl('/transactions/contributions/status'), {
      headers: buildReaderHeaders(),
    });
    const body = await readJson(response);

    if (!response.ok) {
      const message = body?.message || body?.error || 'Failed to fetch contribution statuses';
      throw new Error(message);
    }

    return body?.items || [];
  },

  async fetchCommitStatus(commitId) {
    const response = await fetch(
      buildUrl(`/transactions/commit/${encodeURIComponent(commitId)}/status`),
    );
    const body = await readJson(response);

    if (!response.ok && response.status !== 404) {
      const message = body?.message || body?.error || 'Failed to fetch commit status';
      throw new Error(message);
    }

    return body;
  },
};
