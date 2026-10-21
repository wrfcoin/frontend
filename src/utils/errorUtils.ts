/**
 * Error Utilities
 * Provides helpers for error handling across the application.
 */

/**
 * Wraps an error with a custom message while preserving the original error as a cause.
 * This pattern is compatible with older TypeScript targets that don't support the
 * second argument in the Error constructor.
 *
 * @param message The new error message
 * @param originalError The original error to preserve
 * @returns A new Error object with the original error attached as 'cause'
 */
export function wrapError(message: string, originalError: unknown): Error {
  const error = new Error(message);
  try {
    // Attempt to attach cause for modern environments
    (error as any).cause = originalError;
  } catch (e) {
    // Silently fail if cause cannot be attached
  }
  return error;
}
