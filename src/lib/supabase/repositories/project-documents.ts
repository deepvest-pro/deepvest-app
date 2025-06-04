import { BaseRepository } from '../base-repository';

export interface ProjectDocument {
  id: string;
  project_id: string;
  title: string;
  slug: string;
  content_type: string;
  content?: string;
  description?: string;
  file_urls: string[];
  author_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ProjectDocumentWithAuthor extends ProjectDocument {
  author?: {
    id: string;
    full_name: string;
  } | null;
}

export class ProjectDocumentsRepository extends BaseRepository<ProjectDocument> {
  constructor() {
    super('project_content');
  }

  /**
   * Get all documents for a project (with author information)
   */
  async findByProjectId(
    projectId: string,
    includePrivate = false,
  ): Promise<{ data: ProjectDocumentWithAuthor[] | null; error: string | null }> {
    try {
      const supabase = await this.getClient();

      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (!includePrivate) {
        query = query.eq('is_public', true);
      }

      const { data: documents, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      if (!documents || documents.length === 0) {
        return { data: [], error: null };
      }

      // Get author information
      const authorIds = [...new Set(documents.map(doc => doc.author_id))];
      const { data: authors } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', authorIds);

      // Map authors to documents
      const documentsWithAuthors = documents.map(doc => ({
        ...doc,
        author: authors?.find(author => author.id === doc.author_id) || null,
      }));

      return { data: documentsWithAuthors, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get public documents for a project
   */
  async findPublicByProjectId(
    projectId: string,
  ): Promise<{ data: ProjectDocument[] | null; error: string | null }> {
    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('project_id', projectId)
        .eq('is_public', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      return { data, error: error?.message || null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a new document
   */
  async createDocument(
    documentData: Omit<ProjectDocument, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<{ data: ProjectDocument | null; error: string | null }> {
    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(documentData)
        .select()
        .single();

      return { data, error: error?.message || null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Soft delete a document by setting deleted_at timestamp
   */
  async softDelete(id: string): Promise<{ data: boolean; error: string | null }> {
    try {
      // Use service role client to bypass RLS policies for administrative operations
      const supabase = this.getServiceRoleClient();

      // First check if document exists and is not already deleted
      const { data: existingDoc, error: checkError } = await supabase
        .from(this.tableName)
        .select('id, deleted_at')
        .eq('id', id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return { data: false, error: 'Document not found' };
        }
        return { data: false, error: checkError.message };
      }

      if (existingDoc.deleted_at) {
        return { data: false, error: 'Document is already deleted' };
      }

      // Perform soft delete using service role client
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .is('deleted_at', null)
        .select('id')
        .single();

      if (error) {
        return { data: false, error: error.message };
      }

      if (!data) {
        return {
          data: false,
          error: 'Document could not be deleted (may have been deleted by another process)',
        };
      }

      return { data: true, error: null };
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if slug is available within a project
   */
  async isSlugAvailable(
    projectId: string,
    slug: string,
    excludeId?: string,
  ): Promise<{ data: boolean; error: string | null }> {
    try {
      const supabase = await this.getClient();

      // Build query to check for existing documents with the same slug
      let query = supabase
        .from(this.tableName)
        .select('id')
        .eq('project_id', projectId)
        .eq('slug', slug)
        .is('deleted_at', null);

      // Exclude the current document if updating
      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data: existingDocs, error } = await query;

      if (error) {
        return { data: false, error: error.message };
      }

      // Slug is available if no existing documents found
      const isAvailable = !existingDocs || existingDocs.length === 0;
      return { data: isAvailable, error: null };
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const projectDocumentsRepository = new ProjectDocumentsRepository();
