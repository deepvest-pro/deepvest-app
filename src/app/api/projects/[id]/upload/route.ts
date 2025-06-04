import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { requireAuth, requireProjectPermission, APIError } from '@/lib/api/middleware/auth';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';
import {
  getMaxFileSize,
  getAcceptedFileTypes,
  PROJECT_FILES_BUCKET_NAME,
} from '@/lib/file-constants';

const uploadSchema = z.object({
  uploadType: z.enum(['logo', 'banner', 'document']),
  file: z.custom<File>(val => val instanceof File, 'File is required.'),
});

export const POST = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const { id: projectId } = params;

  const user = await requireAuth();

  await requireProjectPermission(user.id, projectId, 'editor');

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const uploadType = formData.get('uploadType') as 'logo' | 'banner' | 'document' | null;

  if (!file || !uploadType) {
    throw new APIError('File and uploadType are required.', 400);
  }

  const validationResult = uploadSchema.safeParse({ file, uploadType });

  if (!validationResult.success) {
    throw new APIError('Invalid input.', 400);
  }

  const { file: validatedFile, uploadType: validatedUploadType } = validationResult.data;

  // Get accepted file types and max size for this upload type
  const acceptedTypes = getAcceptedFileTypes(validatedUploadType);
  const maxSize = getMaxFileSize(validatedUploadType);

  // Validate file type
  if (!acceptedTypes.includes(validatedFile.type)) {
    throw new APIError(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`, 400);
  }

  // Validate file size
  if (validatedFile.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    throw new APIError(
      `File too large. Max size for ${validatedUploadType} is ${maxSizeMB}MB.`,
      400,
    );
  }

  // Generate unique filename with project folder structure
  const fileExtension = validatedFile.name.split('.').pop();
  const timestamp = Date.now();
  let fileName: string;

  if (validatedUploadType === 'document') {
    // For documents, preserve original filename but make it unique
    const originalName = validatedFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9-_]/g, '_'); // Sanitize filename
    fileName = `${projectId}/documents/${sanitizedName}_${timestamp}.${fileExtension}`;
  } else {
    // For logo/banner, use simple naming
    fileName = `${projectId}/${validatedUploadType}_${timestamp}.${fileExtension}`;
  }

  const bucketName = PROJECT_FILES_BUCKET_NAME;
  const supabase = await SupabaseClientFactory.getServerClient();

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, validatedFile, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError);
    throw new APIError('Failed to upload file to storage.', 500);
  }

  if (!uploadData?.path) {
    console.error('Supabase Storage upload error: No path returned');
    throw new APIError('Failed to upload file to storage. No path returned.', 500);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

  if (!publicUrlData?.publicUrl) {
    console.error('Supabase Storage getPublicUrl error: No public URL returned');
    throw new APIError('Failed to get public URL for the uploaded file.', 500);
  }

  return {
    imageUrl: publicUrlData.publicUrl, // Keep this name for backward compatibility
    fileUrl: publicUrlData.publicUrl, // Add this for documents
    fileName: fileName,
    uploadType: validatedUploadType,
    originalFileName: validatedFile.name,
    fileSize: validatedFile.size,
    mimeType: validatedFile.type,
  };
});
