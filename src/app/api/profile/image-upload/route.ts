// src/app/api/profile/image-upload/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import {
  MAX_AVATAR_SIZE_BYTES,
  MAX_COVER_SIZE_BYTES,
  ACCEPTED_IMAGE_TYPES,
  AVATAR_BUCKET_NAME,
  COVER_BUCKET_NAME,
} from '@/lib/file-constants';
import { z } from 'zod';

const uploadSchema = z.object({
  uploadType: z.enum(['avatar', 'cover']),
  file: z.custom<File>(val => val instanceof File, 'File is required.'),
});

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const uploadType = formData.get('uploadType') as 'avatar' | 'cover' | null;

  if (!file || !uploadType) {
    return NextResponse.json({ error: 'File and uploadType are required.' }, { status: 400 });
  }

  const validationResult = uploadSchema.safeParse({ file, uploadType });

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid input.', details: validationResult.error.format() },
      { status: 400 },
    );
  }

  const { file: validatedFile, uploadType: validatedUploadType } = validationResult.data;

  if (!ACCEPTED_IMAGE_TYPES.includes(validatedFile.type)) {
    return NextResponse.json(
      { error: `Invalid file type. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  const maxSize = validatedUploadType === 'avatar' ? MAX_AVATAR_SIZE_BYTES : MAX_COVER_SIZE_BYTES;
  if (validatedFile.size > maxSize) {
    return NextResponse.json(
      {
        error: `File is too large. Max size for ${validatedUploadType} is ${maxSize / 1024 / 1024}MB.`,
      },
      { status: 400 },
    );
  }

  const userId = session.user.id;
  const fileExt = validatedFile.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const bucketName = validatedUploadType === 'avatar' ? AVATAR_BUCKET_NAME : COVER_BUCKET_NAME;
  const filePath = `${userId}/${fileName}`;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, validatedFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage.', details: uploadError.message },
        { status: 500 },
      );
    }

    if (!uploadData?.path) {
      console.error('Supabase Storage upload error: No path returned');
      return NextResponse.json(
        { error: 'Failed to upload file to storage. No path returned.' },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

    if (!publicUrlData?.publicUrl) {
      console.error('Supabase Storage getPublicUrl error: No public URL returned');
      return NextResponse.json(
        { error: 'Failed to get public URL for the uploaded file.' },
        { status: 500 },
      );
    }

    const imageUrl = publicUrlData.publicUrl;
    const profileUpdateField = validatedUploadType === 'avatar' ? 'avatar_url' : 'cover_url';

    const { data: profileUpdateData, error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({ [profileUpdateField]: imageUrl })
      .eq('id', userId)
      .select()
      .single();

    if (profileUpdateError) {
      console.error('Supabase profile update error:', profileUpdateError);
      return NextResponse.json(
        {
          error: 'Failed to update profile with new image URL.',
          details: profileUpdateError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: `${validatedUploadType} uploaded successfully.`,
      imageUrl,
      profile: profileUpdateData,
    });
  } catch (error) {
    console.error('Image upload POST handler error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during file upload.' },
      { status: 500 },
    );
  }
}
