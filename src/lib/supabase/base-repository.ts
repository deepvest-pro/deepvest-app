/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { SupabaseClientFactory } from './client-factory';

/**
 * Standard response format for repository operations
 */
export interface RepositoryResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Base repository class providing common CRUD operations
 * All specific repositories should extend this class
 */
export abstract class BaseRepository<T = any> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Get Supabase client instance
   *
   * @protected
   * @returns Promise<SupabaseClient<Database>> - Configured Supabase client
   */
  protected async getClient(): Promise<SupabaseClient<Database>> {
    return SupabaseClientFactory.getServerClient();
  }

  /**
   * Get Supabase service role client instance
   * This client bypasses RLS policies and should only be used for administrative operations
   *
   * @protected
   * @returns SupabaseClient<Database> - Service role Supabase client
   */
  protected getServiceRoleClient(): SupabaseClient<Database> {
    return SupabaseClientFactory.getServiceRoleClient();
  }

  /**
   * Handle Supabase query responses with consistent error handling
   *
   * @protected
   * @param queryBuilder - Supabase query builder (awaitable)
   * @returns Promise<RepositoryResponse<T>> - Standardized response
   */
  protected async handleQuery<TResult>(queryBuilder: any): Promise<RepositoryResponse<TResult>> {
    try {
      const { data, error } = await queryBuilder;

      if (error) {
        console.error(`[${this.tableName}Repository] Query error:`, error);
        return { data: null, error: error.message || 'Database query failed' };
      }

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[${this.tableName}Repository] Unexpected error:`, error);
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Find a record by ID
   *
   * @param id - Record ID to find
   * @returns Promise<RepositoryResponse<T>> - Found record or null
   */
  async findById(id: string): Promise<RepositoryResponse<T>> {
    const supabase = await this.getClient();

    const query = supabase.from(this.tableName).select('*').eq('id', id).single();

    return this.handleQuery(query);
  }

  /**
   * Find multiple records with optional filtering
   *
   * @param filters - Optional filters to apply
   * @param options - Query options (limit, order, etc.)
   * @returns Promise<RepositoryResponse<T[]>> - Array of found records
   */
  async findMany(
    filters?: Record<string, any>,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      ascending?: boolean;
      select?: string;
    },
  ): Promise<RepositoryResponse<T[]>> {
    const supabase = await this.getClient();

    let query = supabase.from(this.tableName).select(options?.select || '*');

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    return this.handleQuery(query);
  }

  /**
   * Create a new record
   *
   * @param data - Data to insert
   * @returns Promise<RepositoryResponse<T>> - Created record
   */
  async create(data: Partial<T>): Promise<RepositoryResponse<T>> {
    const supabase = await this.getClient();

    const query = supabase.from(this.tableName).insert(data).select().single();

    return this.handleQuery(query);
  }

  /**
   * Update a record by ID
   *
   * @param id - Record ID to update
   * @param data - Data to update
   * @returns Promise<RepositoryResponse<T>> - Updated record
   */
  async update(id: string, data: Partial<T>): Promise<RepositoryResponse<T>> {
    const supabase = await this.getClient();

    const query = supabase.from(this.tableName).update(data).eq('id', id).select().single();

    return this.handleQuery(query);
  }

  /**
   * Delete a record by ID
   *
   * @param id - Record ID to delete
   * @returns Promise<RepositoryResponse<T>> - Deleted record
   */
  async delete(id: string): Promise<RepositoryResponse<T>> {
    const supabase = await this.getClient();

    const query = supabase.from(this.tableName).delete().eq('id', id).select().single();

    return this.handleQuery(query);
  }

  /**
   * Check if a record exists by ID
   *
   * @param id - Record ID to check
   * @returns Promise<RepositoryResponse<boolean>> - True if exists, false otherwise
   */
  async exists(id: string): Promise<RepositoryResponse<boolean>> {
    const supabase = await this.getClient();

    const query = supabase.from(this.tableName).select('id').eq('id', id).single();

    const result = await this.handleQuery(query);

    return {
      data: result.data !== null,
      error: result.error,
    };
  }

  /**
   * Count records with optional filtering
   *
   * @param filters - Optional filters to apply
   * @returns Promise<RepositoryResponse<number>> - Count of records
   */
  async count(filters?: Record<string, any>): Promise<RepositoryResponse<number>> {
    const supabase = await this.getClient();

    let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true });

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const result = await this.handleQuery(query);

    return {
      data: result.error ? null : (result.data as any)?.count || 0,
      error: result.error,
    };
  }

  /**
   * Execute a custom query with the repository's error handling
   *
   * @protected
   * @param queryBuilder - Function that builds and returns a Supabase query
   * @returns Promise<RepositoryResponse<TResult>> - Query result
   */
  protected async executeQuery<TResult>(
    queryBuilder: (supabase: SupabaseClient<Database>) => any,
  ): Promise<RepositoryResponse<TResult>> {
    const supabase = await this.getClient();
    return this.handleQuery(queryBuilder(supabase));
  }
}
