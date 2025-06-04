// src/app/api/profile/image-upload/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAPIHandler } from '@/lib/api/base-handler';
import { requireAuth } from '@/lib/api/middleware/auth';
import {
  MAX_AVATAR_SIZE_BYTES,
  MAX_COVER_SIZE_BYTES,
  ACCEPTED_IMAGE_TYPES,
  AVATAR_BUCKET_NAME,
  COVER_BUCKET_NAME,
} from '@/lib/file-constants';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

const profileImageUploadSchema = z.object({
  uploadType: z.enum(['avatar', 'cover']),
  file: z.custom<File>(val => val instanceof File, 'File is required.'),
});

export const POST = createAPIHandler(async (request: NextRequest) => {
  const user = await requireAuth();

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const uploadType = formData.get('uploadType') as 'avatar' | 'cover' | null;

  if (!file || !uploadType) {
    throw new Error('File and uploadType are required.');
  }

  const validationResult = profileImageUploadSchema.safeParse({ file, uploadType });

  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.format()}`);
  }

  const { file: validatedFile, uploadType: validatedUploadType } = validationResult.data;

  // Validate file type
  if (!ACCEPTED_IMAGE_TYPES.includes(validatedFile.type)) {
    throw new Error(`Invalid file type. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(', ')}`);
  }

  // Validate file size
  const maxSize = validatedUploadType === 'avatar' ? MAX_AVATAR_SIZE_BYTES : MAX_COVER_SIZE_BYTES;
  if (validatedFile.size > maxSize) {
    throw new Error(
      `File is too large. Max size for ${validatedUploadType} is ${maxSize / 1024 / 1024}MB.`,
    );
  }

  const userId = user.id;
  const fileExt = validatedFile.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const bucketName = validatedUploadType === 'avatar' ? AVATAR_BUCKET_NAME : COVER_BUCKET_NAME;
  const filePath = `${userId}/${fileName}`;

  const supabase = await SupabaseClientFactory.getServerClient();

  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, validatedFile, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError);
    throw new Error(`Failed to upload file to storage: ${uploadError.message}`);
  }

  if (!uploadData?.path) {
    console.error('Supabase Storage upload error: No path returned');
    throw new Error('Failed to upload file to storage. No path returned.');
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

  if (!publicUrlData?.publicUrl) {
    console.error('Supabase Storage getPublicUrl error: No public URL returned');
    throw new Error('Failed to get public URL for the uploaded file.');
  }

  const imageUrl = publicUrlData.publicUrl;
  const profileUpdateField = validatedUploadType === 'avatar' ? 'avatar_url' : 'cover_url';

  // Update user profile with new image URL
  const { data: profileUpdateData, error: profileUpdateError } = await supabase
    .from('user_profiles')
    .update({ [profileUpdateField]: imageUrl })
    .eq('id', userId)
    .select()
    .single();

  if (profileUpdateError) {
    console.error('Supabase profile update error:', profileUpdateError);
    throw new Error(`Failed to update profile with new image URL: ${profileUpdateError.message}`);
  }

  return {
    message: `${validatedUploadType} uploaded successfully.`,
    imageUrl,
    profile: profileUpdateData,
  };
});
