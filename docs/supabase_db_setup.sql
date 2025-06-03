-- DeepVest Database Schema
-- This file contains the SQL definitions for the DeepVest database

-- ==========================================
-- User Profiles Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  professional_background TEXT,
  startup_ecosystem_role TEXT,
  country TEXT,
  city TEXT,
  website_url TEXT,
  x_username TEXT,
  linkedin_username TEXT,
  github_username TEXT
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view all profiles (public data)
CREATE POLICY "Profiles are viewable by everyone" ON public.user_profiles
  FOR SELECT USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Only allow the owner to delete their profile (though this will rarely be used due to CASCADE)
CREATE POLICY "Users can delete their own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_nickname TEXT;
BEGIN
  -- Generate a unique nickname based on email or metadata
  default_nickname := split_part(NEW.email, '@', 1) || floor(random() * 1000)::text;
  
  -- Extract full name from the user metadata if available
  INSERT INTO public.user_profiles (
    id,
    full_name,
    nickname,
    avatar_url
  )
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'full_name')::TEXT,
      (NEW.raw_user_meta_data->>'name')::TEXT,
      split_part(NEW.email, '@', 1)
    ),
    default_nickname,
    COALESCE(
      (NEW.raw_user_meta_data->>'avatar_url')::TEXT,
      (NEW.raw_user_meta_data->>'picture')::TEXT
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create a profile when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at column on profile update
CREATE OR REPLACE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Optional: Create a custom function to check if a nickname is available
CREATE OR REPLACE FUNCTION public.is_nickname_available(nickname TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  nickname_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO nickname_count FROM public.user_profiles WHERE user_profiles.nickname = is_nickname_available.nickname;
  RETURN nickname_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT UPDATE (full_name, nickname, avatar_url, bio, professional_background, 
              startup_ecosystem_role, country, city, website_url, 
              x_username, linkedin_username, github_username) ON public.user_profiles TO authenticated; 