import { APIError } from '@/lib/api/middleware/auth';

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (temporary server errors)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    // Check for specific HTTP status codes that are retryable
    const message = error.message.toLowerCase();
    return (
      message.includes('503') ||
      message.includes('502') ||
      message.includes('504') ||
      message.includes('429')
    );
  }
  return false;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
};

/**
 * Execute a function with retry logic for Gemini API calls
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  const { maxRetries, baseDelay } = config;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // If this is the last attempt or error is not retryable, throw it
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Log retry attempt
      console.warn(
        `Gemini API attempt ${attempt + 1} failed, retrying in ${baseDelay * (attempt + 1)}ms...`,
        error instanceof Error ? error.message : String(error),
      );

      // Wait before retrying with exponential backoff
      await sleep(baseDelay * (attempt + 1));
    }
  }

  // This should never be reached, but just in case
  throw new APIError('Failed after all retries', 500);
}
