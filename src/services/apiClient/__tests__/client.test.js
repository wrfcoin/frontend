import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ApiErrorCode } from '../../../utils/apiError';
import { ApiClient } from '../client';

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('throws a typed service unavailable error when base URL is missing', async () => {
    const client = new ApiClient({ baseUrl: '' });

    await expect(client.get('/health')).rejects.toMatchObject({
      code: ApiErrorCode.SERVICE_UNAVAILABLE,
    });
  });

  it('unwraps standard envelope responses', async () => {
    const client = new ApiClient({ baseUrl: 'https://api.example.com' });
    const response = new Response(
      JSON.stringify({ success: true, data: { ok: true } }),
      { status: 200 },
    );

    global.fetch.mockResolvedValue(response);

    await expect(client.get('/health')).resolves.toEqual({ ok: true });
  });

  it('retries recoverable GET failures', async () => {
    const client = new ApiClient({ baseUrl: 'https://api.example.com', retries: 1 });

    global.fetch
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { status: 'ok' } }), {
          status: 200,
        }),
      );

    const data = await client.get('/status');

    expect(data.status).toBe('ok');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
