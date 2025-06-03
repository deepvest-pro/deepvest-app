import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import {
  getMaxFileSize,
  getAcceptedFileTypes,
  PROJECT_FILES_BUCKET_NAME,
} from '@/lib/file-constants';

const uploadSchema = z.object({
  uploadType: z.enum(['logo', 'banner', 'document']),
  file: z.custom<File>(val => val instanceof File, 'File is required.'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if user has permission to edit this project
    const { data: permission, error: permissionError } = await supabase
      .from('project_permissions')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (permissionError || !permission) {
      console.log('Permission check failed:', { permissionError, projectId, userId: user.id });
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Check if user has edit permissions
    if (!['owner', 'admin', 'editor'].includes(permission.role)) {
      console.log('Insufficient permissions:', { role: permission.role, userId: user.id });
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploadType = formData.get('uploadType') as 'logo' | 'banner' | 'document' | null;

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

    // Get accepted file types and max size for this upload type
    const acceptedTypes = getAcceptedFileTypes(validatedUploadType);
    const maxSize = getMaxFileSize(validatedUploadType);

    // Validate file type
    if (!acceptedTypes.includes(validatedFile.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate file size
    if (validatedFile.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { error: `File too large. Max size for ${validatedUploadType} is ${maxSizeMB}MB.` },
        { status: 400 },
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

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, validatedFile, {
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

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

    if (!publicUrlData?.publicUrl) {
      console.error('Supabase Storage getPublicUrl error: No public URL returned');
      return NextResponse.json(
        { error: 'Failed to get public URL for the uploaded file.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrlData.publicUrl, // Keep this name for backward compatibility
      fileUrl: publicUrlData.publicUrl, // Add this for documents
      fileName: fileName,
      uploadType: validatedUploadType,
      originalFileName: validatedFile.name,
      fileSize: validatedFile.size,
      mimeType: validatedFile.type,
    });
  } catch (error) {
    console.error('Project upload POST handler error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during file upload.' },
      { status: 500 },
    );
  }
}
