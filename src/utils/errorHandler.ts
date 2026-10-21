/**
 * Global Error Handler for Wrfcoin Frontend - TypeScript Implementation
 * Prevents unhandled promise rejections and provides better error management
 */

import { createLogger } from './logger';

const log = createLogger('error-handler');

// Types
interface ErrorEvent extends Event {
  error: Error & {
    componentStack?: string;
  };
}

interface PromiseRejectionEvent extends Event {
  reason: any;
  promise: Promise<any>;
}

type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;
type SafeAsyncFunction<T extends any[], R> = (...args: T) => Promise<R | null>;

class ErrorHandler {
  constructor() {
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener(
      'unhandledrejection',
      (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        const message = reason?.message || String(reason);

        // WebSocket reconnection errors are handled by WebSocketManager — suppress noise
        if (message.includes('WebSocket')) {
          log.warn('WebSocket rejection (handled by WebSocketManager):', message);
          event.preventDefault();
          return;
        }

        // All other rejections: log, report to monitoring, and let them surface
        log.error('Unhandled Promise Rejection:', reason);
        ErrorHandler.handleError(
          reason instanceof Error ? reason : new Error(message),
          'unhandledrejection',
        );
      },
    );

    // Handle regular errors
    window.addEventListener('error', (event: ErrorEvent) => {
      log.error('Global Error:', event.error);

      // Handle React errors gracefully
      if (event.error && event.error.componentStack) {
        log.info('React component error handled');
      }
    });
  }

  /**
   * Safe promise wrapper
   */
  static safePromise<T>(
    promise: Promise<T>,
    fallback: T | null = null,
  ): Promise<T | null> {
    return promise.catch(error => {
      log.warn('Promise failed safely:', error.message);
      return fallback;
    });
  }

  /**
   * Safe async wrapper
   */
  static safeAsync<T extends any[], R>(
    asyncFn: AsyncFunction<T, R>,
  ): SafeAsyncFunction<T, R> {
    return async (...args: T): Promise<R | null> => {
      try {
        return await asyncFn(...args);
      } catch (error: any) {
        log.warn('Async function failed safely:', error.message);
        return null;
      }
    };
  }

  /**
   * Error boundary for manual error handling
   */
  static handleError(error: Error, context?: string): void {
    log.error(`Error in ${context || 'unknown context'}:`, error);

    // You could extend this to send errors to a logging service
    // Example: sendToLoggingService(error, context);
  }

  /**
   * Retry wrapper for functions that might fail
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        log.warn(`Attempt ${attempt} failed:`, error.message);

        if (attempt === maxAttempts) {
          log.error('All retry attempts failed');
          return null;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return null;
  }

  /**
   * Debounced error handler to prevent spam
   */
  static createDebouncedErrorHandler(delay: number = 1000) {
    let timeoutId: NodeJS.Timeout | null = null;
    const errorQueue: Array<{ error: Error; context?: string }> = [];

    return (error: Error, context?: string) => {
      errorQueue.push({ error, context });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        console.group('Batched Errors:');
        errorQueue.forEach(({ error, context }) => {
          log.error(`${context || 'Unknown'}:`, error);
        });
        console.groupEnd();

        errorQueue.length = 0; // Clear the queue
        timeoutId = null;
      }, delay);
    };
  }
}

// Initialize global error handler
const errorHandler = new ErrorHandler();

// Export types and classes
export default ErrorHandler;
export { errorHandler };
export type {
  ErrorEvent,
  PromiseRejectionEvent,
  AsyncFunction,
  SafeAsyncFunction,
};
