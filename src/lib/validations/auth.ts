import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  nickname: z
    .string()
    .min(3, 'Nickname must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens and underscores are allowed')
    .max(30, 'Maximum length is 30 characters'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  nickname: z
    .string()
    .min(3, 'Nickname must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens and underscores are allowed')
    .max(30, 'Maximum length is 30 characters'),
  bio: z.string().max(500, 'Maximum length is 500 characters').optional().nullable(),
  professional_background: z
    .string()
    .max(1000, 'Maximum length is 1000 characters')
    .optional()
    .nullable(),
  startup_ecosystem_role: z
    .string()
    .max(100, 'Maximum length is 100 characters')
    .optional()
    .nullable(),
  country: z.string().max(50, 'Maximum length is 50 characters').optional().nullable(),
  city: z.string().max(50, 'Maximum length is 50 characters').optional().nullable(),
  website_url: z
    .string()
    .url('Please enter a valid URL')
    .max(255, 'Maximum length is 255 characters')
    .optional()
    .nullable(),
  x_username: z.string().max(50, 'Maximum length is 50 characters').optional().nullable(),
  linkedin_username: z.string().max(100, 'Maximum length is 100 characters').optional().nullable(),
  github_username: z.string().max(50, 'Maximum length is 50 characters').optional().nullable(),
});

// Types based on Zod schemas
export type SignInCredentials = z.infer<typeof signInSchema>;
export type SignUpCredentials = z.infer<typeof signUpSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
