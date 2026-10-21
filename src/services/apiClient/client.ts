import ApiError, { ApiErrorCode } from '../../utils/apiError';
import { getAuthToken } from '../authTokenStore';
import { parseJsonPreservingBigInts } from './losslessJson';
import type { ApiEnvelope } from './types';

export interface ApiClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readAuthToken(): string {
  return getAuthToken();
}

function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return 'data' in candidate || 'success' in candidate;
}

export class ApiClient {
  private readonly baseUrl: string;

  private readonly timeoutMs: number;

  private readonly retries: number;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = options.retries ?? DEFAULT_RETRIES;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  async getWithFallback<T>(paths: string[]): Promise<T> {
    let lastError: unknown;

    for (const path of paths) {
      try {
        return await this.get<T>(path);
      } catch (error) {
        lastError = error;
        if (
          error instanceof ApiError &&
          error.status !== 404 &&
          !error.isRecoverable()
        ) {
          throw error;
        }
      }
    }

    throw (lastError instanceof Error ? lastError : new Error('All fallback requests failed'));
  }

  async postWithFallback<T>(paths: string[], body?: unknown): Promise<T> {
    let lastError: unknown;

    for (const path of paths) {
      try {
        return await this.post<T>(path, body);
      } catch (error) {
        lastError = error;
        if (error instanceof ApiError && error.status !== 404) {
          throw error;
        }
      }
    }

    throw (lastError instanceof Error ? lastError : new Error('All fallback requests failed'));
  }

  private ensureConfigured(): void {
    if (!this.baseUrl) {
      throw new ApiError(
        'API base URL is not configured. Set VITE_API_BASE_URL or VITE_API_URL.',
        503,
        ApiErrorCode.SERVICE_UNAVAILABLE,
      );
    }
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private buildHeaders(hasBody: boolean): HeadersInit {
    const token = readAuthToken();
    return hasBody
      ? {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
      }
      : {
        ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
      };
  }

  private async fetchWithTimeout(
    url: string,
    method: string,
    body?: unknown,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, {
        method,
        headers: this.buildHeaders(body !== undefined),
        signal: controller.signal,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' ||
          error.message.toLowerCase().includes('abort'))
      ) {
        throw new ApiError('Request timed out', 0, ApiErrorCode.TIMEOUT);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    this.ensureConfigured();

    const url = this.buildUrl(path);
    const canRetry = method === 'GET';
    const maxAttempts = canRetry ? this.retries + 1 : 1;

    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        const response = await this.fetchWithTimeout(url, method, body);

        if (!response.ok) {
          throw await ApiError.fromResponse(response);
        }

        if (response.status === 204) {
          return undefined as T;
        }

        // Parse via the raw response text with a big-integer-preserving parser
        // (issue #236): core4 emits u64/u128 balances as bare JSON numbers, and
        // native `Response.json()` (JSON.parse) would truncate any value above
        // 2^53-1 before any consumer code runs. The raw decimal digits survive
        // in the response text, so we recover them losslessly as strings.
        const rawText = await response.text();
        const payload = (
          rawText.length === 0 ? undefined : parseJsonPreservingBigInts(rawText)
        ) as unknown;

        if (isEnvelope<T>(payload)) {
          if (payload.success === false) {
            const errorPayload = payload as Record<string, unknown>;
            const statusCandidate = Number(
              errorPayload.status ||
                errorPayload.statusCode ||
                errorPayload.httpStatus ||
                400,
            );
            throw new ApiError(
              payload.error || payload.message || 'API request failed',
              Number.isFinite(statusCandidate) ? statusCandidate : 400,
              undefined,
              (payload.details || errorPayload) as Record<string, unknown>,
            );
          }
          if ('data' in payload) {
            return payload.data as T;
          }
        }

        return payload as T;
      } catch (error) {
        attempt += 1;

        const isLastAttempt = attempt >= maxAttempts;
        const apiError = ApiError.fromError(error);

        if (!canRetry || isLastAttempt || !apiError.isRecoverable()) {
          throw apiError;
        }

        await sleep(250 * 2 ** (attempt - 1));
      }
    }

    throw new ApiError('API request failed after retries', 500, ApiErrorCode.SERVER_ERROR);
  }
}

export default ApiClient;
