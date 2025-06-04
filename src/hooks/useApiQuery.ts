import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { APIClient, type APIClientResponse } from '@/lib/utils/api';

/**
 * Options for useApiQuery hook
 */
export interface UseApiQueryOptions<TData = unknown, TError = string>
  extends Omit<
    UseQueryOptions<APIClientResponse<TData>, TError, TData, readonly unknown[]>,
    'queryKey' | 'queryFn'
  > {
  /**
   * Query key for React Query
   */
  queryKey?: readonly unknown[];
  /**
   * Enable automatic refetching when window gets focus
   * @default false
   */
  refetchOnWindowFocus?: boolean;
  /**
   * Time in milliseconds to consider data fresh
   * @default 5 * 60 * 1000 (5 minutes)
   */
  staleTime?: number;
}

/**
 * Custom hook for making GET API requests with React Query
 * Provides standardized error handling and caching behavior
 *
 * @param endpoint - API endpoint path (without /api prefix)
 * @param options - Query options and configuration
 * @returns React Query result with typed data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useApiQuery<Project>('/projects/123', {
 *   queryKey: QUERY_KEYS.projects.detail('123'),
 *   enabled: !!projectId,
 * });
 * ```
 */
export function useApiQuery<TData = unknown>(
  endpoint: string,
  options: UseApiQueryOptions<TData> = {},
): UseQueryResult<TData, string> {
  const {
    queryKey,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    enabled = true,
    ...queryOptions
  } = options;

  // Generate default query key if not provided
  const defaultQueryKey = endpoint.split('/').filter(Boolean);

  return useQuery({
    queryKey: queryKey || defaultQueryKey,
    queryFn: async (): Promise<APIClientResponse<TData>> => {
      const response = await APIClient.get<TData>(endpoint);
      return response;
    },
    select: (data: APIClientResponse<TData>): TData => {
      if (!data.success || data.error) {
        throw new Error(data.error || 'API request failed');
      }
      return data.data as TData;
    },
    refetchOnWindowFocus,
    staleTime,
    enabled,
    ...queryOptions,
  });
}

/**
 * Hook for making API queries with automatic query key generation based on endpoint
 * Useful for simple queries where you don't need custom query keys
 *
 * @param endpoint - API endpoint path
 * @param options - Query options
 * @returns React Query result
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useApiQueryAuto<Project[]>('/projects');
 * ```
 */
export function useApiQueryAuto<TData = unknown>(
  endpoint: string,
  options: Omit<UseApiQueryOptions<TData>, 'queryKey'> = {},
): UseQueryResult<TData, string> {
  return useApiQuery<TData>(endpoint, {
    ...options,
    queryKey: endpoint.split('/').filter(Boolean),
  });
}

/**
 * Hook for conditional API queries
 * Only executes the query when the condition is met
 *
 * @param endpoint - API endpoint path
 * @param condition - Condition to enable the query
 * @param options - Query options
 * @returns React Query result
 *
 * @example
 * ```tsx
 * const { data } = useApiQueryWhen<User>(
 *   `/users/${userId}`,
 *   !!userId,
 *   { queryKey: QUERY_KEYS.users.detail(userId) }
 * );
 * ```
 */
export function useApiQueryWhen<TData = unknown>(
  endpoint: string,
  condition: boolean,
  options: UseApiQueryOptions<TData> = {},
): UseQueryResult<TData, string> {
  return useApiQuery<TData>(endpoint, {
    ...options,
    enabled: condition && options.enabled !== false,
  });
}
