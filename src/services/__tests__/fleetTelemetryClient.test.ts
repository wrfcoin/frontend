import { jest } from '@jest/globals';
import { FleetTelemetryClient } from '../fleetTelemetryClient';

describe('FleetTelemetryClient', () => {
  it('does not render an empty telemetry response as available', async () => {
    const client = new FleetTelemetryClient('https://node.tailnet.ts.net', (async () => new Response(JSON.stringify({ services: [] }), { status: 200 })) as typeof fetch);
    await expect(client.read()).resolves.toMatchObject({ state: 'unavailable', reason: 'empty telemetry response' });
  });

  it('does not accept malformed service rows', async () => {
    const client = new FleetTelemetryClient('https://node.tailnet.ts.net', (async () => new Response(JSON.stringify({ services: [{}] }), { status: 200 })) as typeof fetch);
    await expect(client.read()).resolves.toMatchObject({ state: 'unavailable', reason: 'invalid telemetry envelope' });
  });

  it('does not accept non-array services envelopes', async () => {
    const client = new FleetTelemetryClient('https://node.tailnet.ts.net', (async () => new Response(JSON.stringify({ services: 123 }), { status: 200 })) as typeof fetch);
    await expect(client.read()).resolves.toMatchObject({ state: 'unavailable', reason: 'invalid telemetry envelope' });
  });

  it('uses only the configured gateway telemetry route', async () => {
    const request = jest.fn<typeof fetch>(async () => new Response(JSON.stringify({ services: [{ id: 'node', status: 'healthy' }] }), { status: 200 }));
    const client = new FleetTelemetryClient('https://node.tailnet.ts.net/', request);
    await expect(client.read()).resolves.toMatchObject({ state: 'available' });
    expect(request).toHaveBeenCalledWith('https://node.tailnet.ts.net/api/v1/telemetry', expect.any(Object));
  });

  it('distinguishes malformed JSON from gateway unreachability', async () => {
    const client = new FleetTelemetryClient('https://node.tailnet.ts.net', (async () => new Response('no-json', { status: 200 })) as typeof fetch);
    await expect(client.read()).resolves.toMatchObject({ state: 'unavailable', reason: 'malformed telemetry JSON' });
  });

  it('times out a hanging request instead of waiting forever', async () => {
    const request = jest.fn((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = (init as { signal?: AbortSignal } | undefined)?.signal;
        if (signal) {
          signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }
      });
    }) as typeof fetch;
    const client = new FleetTelemetryClient('https://node.tailnet.ts.net', request, 1);
    await expect(client.read()).resolves.toMatchObject({ state: 'unavailable', reason: 'gateway timeout' });
  });
});

