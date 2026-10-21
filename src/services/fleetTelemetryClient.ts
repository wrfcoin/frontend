export type TelemetryState = 'available' | 'unavailable';

export type FleetTelemetry = {
  state: TelemetryState;
  services: Array<{ id: string; status: string }>;
  fetchedAt: string | null;
  reason?: string;
};

type FetchLike = typeof fetch;
type TelemetryService = { id: string; status: string };

/** Tailnet-gateway client. It never falls back to node RPC or a public host. */
export class FleetTelemetryClient {
  constructor(
    private readonly baseUrl: string,
    private readonly request: FetchLike = fetch,
    private readonly timeoutMs = 2000,
  ) {}

  async read(): Promise<FleetTelemetry> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.request(`${this.baseUrl.replace(/\/$/, '')}/api/v1/telemetry`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        return { state: 'unavailable', services: [], fetchedAt: null, reason: `HTTP ${response.status}` };
      }
      // A gateway that responded with unparseable JSON is NOT unreachable;
      // letting response.json() reject into the transport catch below would
      // report 'gateway unreachable' for a gateway that plainly answered.
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return {
          state: 'unavailable',
          services: [],
          fetchedAt: null,
          reason: 'malformed telemetry JSON',
        };
      }
      const parseResult = this.parseServices(body);
      if (parseResult === null) {
        return { state: 'unavailable', services: [], fetchedAt: null, reason: 'invalid telemetry envelope' };
      }
      const { services, fetchedAt } = parseResult;
      if (services.length === 0) {
        return { state: 'unavailable', services: [], fetchedAt: null, reason: 'empty telemetry response' };
      }
      return { state: 'available', services, fetchedAt };
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { state: 'unavailable', services: [], fetchedAt: null, reason: 'gateway timeout' };
      }
      if (error instanceof SyntaxError) {
        return { state: 'unavailable', services: [], fetchedAt: null, reason: 'malformed telemetry JSON' };
      }
      return { state: 'unavailable', services: [], fetchedAt: null, reason: 'gateway unreachable' };
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseServices(body: unknown): { services: TelemetryService[]; fetchedAt: string | null } | null {
    if (!body || typeof body !== 'object') return null;
    const { services, generatedAt } = body as { services?: unknown; generatedAt?: unknown };
    if (!Array.isArray(services)) return null;
    const parsed: TelemetryService[] = [];
    for (const service of services) {
      if (!this.isValidService(service)) return null;
      parsed.push(service);
    }
    const fetchedAt = typeof generatedAt === 'string' ? generatedAt : null;
    return { services: parsed, fetchedAt };
  }

  private isValidService(service: unknown): service is TelemetryService {
    if (!service || typeof service !== 'object') return false;
    const candidate = service as { id?: unknown; status?: unknown };
    return typeof candidate.id === 'string' && candidate.id.length > 0 && typeof candidate.status === 'string' && candidate.status.length > 0;
  }
}

