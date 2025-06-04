// Central export for all types
export * from './auth';
export * from './ai';
export * from './supabase';
export * from './transcribe';

// Re-export commonly used API types
export type { APIResponse } from '@/lib/api/base-handler';

// Common utility types
export type UUID = string;
export type Timestamp = string;

export interface BaseEntity {
  id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface FormFieldError {
  message: string;
  type: string;
}

export interface FormState {
  isLoading: boolean;
  errors: Record<string, FormFieldError>;
  isDirty: boolean;
  isValid: boolean;
}
