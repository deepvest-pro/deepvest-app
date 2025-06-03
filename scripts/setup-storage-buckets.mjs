#!/usr/bin/env node

/**
 * Script to create and configure Supabase storage buckets for profile images
 * Run this script once during project setup
 *
 * Usage:
 * node scripts/setup-storage-buckets.js
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Initialize environment variables
config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const buckets = [
  {
    id: 'avatars',
    name: 'User Profile Avatars',
    public: true,
  },
  {
    id: 'profile-covers',
    name: 'User Profile Cover Images',
    public: true,
  },
];

async function setupBuckets() {
  console.log('Setting up storage buckets...');

  for (const bucket of buckets) {
    console.log(`Creating bucket: ${bucket.id}`);

    try {
      // Check if bucket exists
      const { data: existingBucket } = await supabase.storage.getBucket(bucket.id);

      if (!existingBucket) {
        // Create bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        });

        if (createError) {
          console.error(`Error creating bucket ${bucket.id}:`, createError.message);
          continue;
        }

        console.log(`✅ Created bucket: ${bucket.id}`);
      } else {
        console.log(`ℹ️ Bucket already exists: ${bucket.id}`);

        // Update bucket configuration
        const { error: updateError } = await supabase.storage.updateBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        });

        if (updateError) {
          console.error(`Error updating bucket ${bucket.id}:`, updateError.message);
          continue;
        }

        console.log(`✅ Updated bucket: ${bucket.id}`);
      }
    } catch (error) {
      console.error(`Error setting up bucket ${bucket.id}:`, error.message);
    }
  }

  console.log('Storage bucket setup complete!');
  console.log('\n--- Recommended RLS Policies ---');
  console.log('Please apply these policies in your Supabase SQL Editor for each bucket:');

  const rlsPolicies = {
    avatars: [
      {
        name: 'Public read access for avatars',
        sql: `
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );`,
      },
      {
        name: 'User can upload their own avatars',
        sql: `
CREATE POLICY "User can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);`,
      },
      {
        name: 'User can update their own avatars',
        sql: `
CREATE POLICY "User can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);`,
      },
      {
        name: 'User can delete their own avatars',
        sql: `
CREATE POLICY "User can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);`,
      },
    ],
    'profile-covers': [
      {
        name: 'Public read access for profile covers',
        sql: `
CREATE POLICY "Public read access for profile covers"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-covers' );`,
      },
      {
        name: 'User can upload their own profile covers',
        sql: `
CREATE POLICY "User can upload their own profile covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-covers' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);`,
      },
      {
        name: 'User can update their own profile covers',
        sql: `
CREATE POLICY "User can update their own profile covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-covers' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-covers' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);`,
      },
      {
        name: 'User can delete their own profile covers',
        sql: `
CREATE POLICY "User can delete their own profile covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-covers' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);`,
      },
    ],
  };

  for (const bucketName of Object.keys(rlsPolicies)) {
    console.log(`\n-- For bucket: ${bucketName} --`);
    console.log(
      `-- Make sure to drop existing policies with the same names if you are re-applying, e.g.:`,
    );
    console.log(
      `-- DROP POLICY IF EXISTS "Public read access for ${bucketName}" ON storage.objects;`,
    );
    rlsPolicies[bucketName].forEach(policy => {
      console.log(`\n-- Policy: ${policy.name}`);
      console.log(policy.sql.trim());
    });
  }
  console.log('\n--- End of RLS Policies ---');
  console.log(
    'Note: If you have existing policies, you might need to DROP them first or adjust names to avoid conflicts.',
  );
}

// Run the setup
setupBuckets().catch(error => {
  console.error('Failed to set up buckets:', error);
  process.exit(1);
});
