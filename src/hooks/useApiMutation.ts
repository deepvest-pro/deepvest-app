import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { APIClient, type APIClientResponse } from '@/lib/utils/api';

/**
 * HTTP methods supported by the API mutation hook
 */
export type APIMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Variables passed to mutation function
 */
export interface MutationVariables<TData = unknown> {
  data?: TData;
  params?: Record<string, string>;
}

/**
 * Options for useApiMutation hook
 */
export interface UseApiMutationOptions<TData = unknown, TVariables = unknown, TError = string>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  /**
   * Query keys to invalidate on successful mutation
   */
  invalidateQueries?: readonly unknown[][];
  /**
   * Show success toast message
   */
  successMessage?: string;
  /**
   * Show error toast message
   */
  showErrorToast?: boolean;
}

/**
 * Custom hook for making API mutations (POST, PUT, PATCH, DELETE) with React Query
 * Provides standardized error handling and automatic cache invalidation
 *
 * @param endpoint - API endpoint path (without /api prefix)
 * @param method - HTTP method to use
 * @param options - Mutation options and configuration
 * @returns React Query mutation result
 *
 * @example
 * ```tsx
 * const createProject = useApiMutation<Project, CreateProjectData>('/projects', 'POST', {
 *   onSuccess: (data) => {
 *     router.push(`/projects/${data.id}`);
 *   },
 *   invalidateQueries: [QUERY_KEYS.projects.all],
 * });
 *
 * // Usage
 * createProject.mutate({ name: 'New Project', slug: 'new-project' });
 * ```
 */
export function useApiMutation<TData = unknown, TVariables = unknown, TError = string>(
  endpoint: string,
  method: APIMethod,
  options: UseApiMutationOptions<TData, TVariables, TError> = {},
): UseMutationResult<TData, TError, TVariables> {
  const queryClient = useQueryClient();
  const {
    invalidateQueries = [],
    successMessage,
    showErrorToast = true,
    onSuccess,
    onError,
    ...mutationOptions
  } = options;

  return useMutation({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      let response: APIClientResponse<TData>;

      // Extract data from variables if it's wrapped in MutationVariables
      const requestData = (variables as MutationVariables)?.data || variables;

      // Make API request based on method
      switch (method) {
        case 'POST':
          response = await APIClient.post<TData>(endpoint, requestData);
          break;
        case 'PUT':
          response = await APIClient.put<TData>(endpoint, requestData);
          break;
        case 'PATCH':
          response = await APIClient.patch<TData>(endpoint, requestData);
          break;
        case 'DELETE':
          response = await APIClient.delete<TData>(endpoint);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      if (!response.success || response.error) {
        throw new Error(response.error || 'API request failed');
      }

      return response.data as TData;
    },
    onSuccess: (data, variables, context) => {
      // Invalidate specified queries
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Show success message if provided
      if (successMessage) {
        // Note: Toast implementation would be handled by the component
        console.log('Success:', successMessage);
      }

      // Call custom onSuccess handler
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Show error toast if enabled
      if (showErrorToast) {
        // Note: Toast implementation would be handled by the component
        console.error('Mutation error:', error);
      }

      // Call custom onError handler
      onError?.(error, variables, context);
    },
    ...mutationOptions,
  });
}

/**
 * Specialized hook for creating resources (POST requests)
 *
 * @param endpoint - API endpoint path
 * @param options - Mutation options
 * @returns Mutation result for creating resources
 *
 * @example
 * ```tsx
 * const createProject = useCreateMutation<Project, CreateProjectData>('/projects', {
 *   invalidateQueries: [QUERY_KEYS.projects.all],
 *   successMessage: 'Project created successfully',
 * });
 * ```
 */
export function useCreateMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options: UseApiMutationOptions<TData, TVariables> = {},
) {
  return useApiMutation<TData, TVariables>(endpoint, 'POST', options);
}

/**
 * Specialized hook for updating resources (PUT requests)
 *
 * @param endpoint - API endpoint path
 * @param options - Mutation options
 * @returns Mutation result for updating resources
 */
export function useUpdateMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options: UseApiMutationOptions<TData, TVariables> = {},
) {
  return useApiMutation<TData, TVariables>(endpoint, 'PUT', options);
}

/**
 * Specialized hook for partially updating resources (PATCH requests)
 *
 * @param endpoint - API endpoint path
 * @param options - Mutation options
 * @returns Mutation result for patching resources
 */
export function usePatchMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options: UseApiMutationOptions<TData, TVariables> = {},
) {
  return useApiMutation<TData, TVariables>(endpoint, 'PATCH', options);
}

/**
 * Specialized hook for deleting resources (DELETE requests)
 *
 * @param endpoint - API endpoint path
 * @param options - Mutation options
 * @returns Mutation result for deleting resources
 *
 * @example
 * ```tsx
 * const deleteProject = useDeleteMutation<void>(`/projects/${projectId}`, {
 *   invalidateQueries: [QUERY_KEYS.projects.all],
 *   successMessage: 'Project deleted successfully',
 * });
 * ```
 */
export function useDeleteMutation<TData = unknown>(
  endpoint: string,
  options: UseApiMutationOptions<TData, void> = {},
) {
  return useApiMutation<TData, void>(endpoint, 'DELETE', options);
}

/**
 * Hook for file upload mutations using FormData
 *
 * @param endpoint - API endpoint path
 * @param options - Mutation options
 * @returns Mutation result for file uploads
 *
 * @example
 * ```tsx
 * const uploadFile = useUploadMutation<UploadResponse>('/projects/123/upload', {
 *   onSuccess: (data) => {
 *     console.log('Files uploaded:', data.files);
 *   },
 * });
 *
 * // Usage
 * const formData = new FormData();
 * formData.append('file', file);
 * uploadFile.mutate(formData);
 * ```
 */
export function useUploadMutation<TData = unknown>(
  endpoint: string,
  options: UseApiMutationOptions<TData, FormData> = {},
) {
  const queryClient = useQueryClient();
  const {
    invalidateQueries = [],
    successMessage,
    showErrorToast = true,
    onSuccess,
    onError,
    ...mutationOptions
  } = options;

  return useMutation({
    mutationFn: async (formData: FormData): Promise<TData> => {
      const response = await APIClient.upload<TData>(endpoint, formData);

      if (!response.success || response.error) {
        throw new Error(response.error || 'Upload failed');
      }

      return response.data as TData;
    },
    onSuccess: (data, variables, context) => {
      // Invalidate specified queries
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Show success message if provided
      if (successMessage) {
        console.log('Success:', successMessage);
      }

      // Call custom onSuccess handler
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Show error toast if enabled
      if (showErrorToast) {
        console.error('Upload error:', error);
      }

      // Call custom onError handler
      onError?.(error, variables, context);
    },
    ...mutationOptions,
  });
}
