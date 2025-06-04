// Client factory and base repository
export { SupabaseClientFactory } from './client-factory';
export { BaseRepository } from './base-repository';
export type { RepositoryResponse } from './base-repository';

// Client utilities and auth functions
export { getCurrentUser, getUserWithProfile, getCurrentSession } from './client';

// Convenience function for creating server client (alias for SupabaseClientFactory.getServerClient)
import { SupabaseClientFactory } from './client-factory';
export const createSupabaseServerClient = () => SupabaseClientFactory.getServerClient();

// Helper functions for database operations
export * from './helpers';

// Middleware
export * from './middleware';

// Configuration
export * from './config';

// Debug helpers
export * from './debug-helpers';
