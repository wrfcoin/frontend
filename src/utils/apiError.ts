/**
 * Standardized API Error Class
 *
 * Provides consistent error handling across all frontend services
 * with proper typing and useful error information
 */

/**
 * Error codes for common API failure scenarios
 */
export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Map HTTP status codes to error codes
 */
function getErrorCodeFromStatus(status: number): ApiErrorCode {
  switch (status) {
  case 401:
    return ApiErrorCode.UNAUTHORIZED;
  case 403:
    return ApiErrorCode.FORBIDDEN;
  case 404:
    return ApiErrorCode.NOT_FOUND;
  case 422:
    return ApiErrorCode.VALIDATION_ERROR;
  case 502:
  case 503:
  case 504:
    return ApiErrorCode.SERVICE_UNAVAILABLE;
  default:
    if (status >= 500) return ApiErrorCode.SERVER_ERROR;
    return ApiErrorCode.UNKNOWN;
  }
}

/**
 * Standardized API Error class for consistent error handling
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    status: number = 0,
    code?: ApiErrorCode,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || getErrorCodeFromStatus(status);
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Create an ApiError from a fetch Response
   */
  static async fromResponse(
    response: Response,
    defaultMessage?: string,
  ): Promise<ApiError> {
    let message = defaultMessage || `Request failed with status ${response.status}`;
    let details: Record<string, unknown> | undefined;

    let code: ApiErrorCode | undefined;

    try {
      const data = await response.json();
      if (data.message) message = data.message;
      if (typeof data.error === 'string') {
        message = data.error;
      } else if (data.error && typeof data.error === 'object') {
        // Canonical backend error envelope: { error: { code, message } }
        // (e.g. /api/onboarding/* routes). Without this branch the object
        // would be assigned to `message` and render as "[object Object]".
        const nested = data.error as Record<string, unknown>;
        if (typeof nested.message === 'string' && nested.message) {
          message = nested.message;
        }
        details = nested;
        if (
          typeof nested.code === 'string' &&
          (Object.values(ApiErrorCode) as string[]).includes(nested.code)
        ) {
          code = nested.code as ApiErrorCode;
        }
      }
      if (data.details) {
        details = { ...(details || {}), ...(data.details as Record<string, unknown>) };
      }
    } catch {
      // Response body is not JSON, use default message
    }

    return new ApiError(message, response.status, code, details);
  }

  /**
   * Create an ApiError from a caught exception
   */
  static fromError(error: unknown, defaultMessage?: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new ApiError(
        'Network error - please check your connection',
        0,
        ApiErrorCode.NETWORK_ERROR,
      );
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new ApiError(
          'Request timed out',
          0,
          ApiErrorCode.TIMEOUT,
        );
      }
      return new ApiError(
        error.message || defaultMessage || 'An unexpected error occurred',
        0,
        ApiErrorCode.UNKNOWN,
      );
    }

    return new ApiError(
      defaultMessage || 'An unexpected error occurred',
      0,
      ApiErrorCode.UNKNOWN,
    );
  }

  /**
   * Check if the error is recoverable (can retry)
   */
  isRecoverable(): boolean {
    return (
      this.code === ApiErrorCode.NETWORK_ERROR ||
      this.code === ApiErrorCode.TIMEOUT ||
      this.code === ApiErrorCode.SERVICE_UNAVAILABLE ||
      (this.status >= 500 && this.status < 600)
    );
  }

  /**
   * Check if the error requires re-authentication
   */
  requiresAuth(): boolean {
    return this.code === ApiErrorCode.UNAUTHORIZED;
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
    case ApiErrorCode.NETWORK_ERROR:
      return 'Unable to connect. Please check your internet connection.';
    case ApiErrorCode.TIMEOUT:
      return 'The request took too long. Please try again.';
    case ApiErrorCode.UNAUTHORIZED:
      return 'Please sign in to continue.';
    case ApiErrorCode.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case ApiErrorCode.NOT_FOUND:
      return 'The requested resource was not found.';
    case ApiErrorCode.SERVICE_UNAVAILABLE:
      return 'Service is temporarily unavailable. Please try again later.';
    case ApiErrorCode.SERVER_ERROR:
      return 'Something went wrong on our end. Please try again later.';
    default:
      return this.message;
    }
  }

  /**
   * Convert error to a plain object for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export default ApiError;
