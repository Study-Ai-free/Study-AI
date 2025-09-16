-- StudyAI User Management Schema for Supabase
-- Run these commands in your Supabase SQL editor

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table for additional user data
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'enterprise')),
    storage_quota BIGINT DEFAULT 5368709120, -- 5GB in bytes
    storage_used BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_folders table for tracking user-created folders
CREATE TABLE IF NOT EXISTS public.user_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    folder_name TEXT NOT NULL,
    folder_path TEXT NOT NULL,
    parent_folder_id UUID REFERENCES public.user_folders(id) ON DELETE CASCADE,
    cloud_provider TEXT NOT NULL CHECK (cloud_provider IN ('onedrive', 'googledrive', 'icloud', 'supabase')),
    provider_folder_id TEXT, -- ID from the cloud provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, folder_path, cloud_provider)
);

-- Create user_files table for tracking user uploads
CREATE TABLE IF NOT EXISTS public.user_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    folder_id UUID REFERENCES public.user_folders(id) ON DELETE SET NULL,
    cloud_provider TEXT NOT NULL CHECK (cloud_provider IN ('onedrive', 'googledrive', 'icloud', 'supabase')),
    provider_file_id TEXT, -- ID from the cloud provider
    upload_status TEXT DEFAULT 'uploading' CHECK (upload_status IN ('uploading', 'completed', 'failed', 'processing')),
    ai_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_quizzes table for AI-generated quizzes
CREATE TABLE IF NOT EXISTS public.user_quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quiz_title TEXT NOT NULL,
    source_file_id UUID REFERENCES public.user_files(id) ON DELETE CASCADE,
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    questions JSONB NOT NULL, -- Store questions and answers as JSON
    total_questions INTEGER NOT NULL,
    ai_provider TEXT DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'google', 'anthropic')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_quiz_attempts table for tracking quiz performance
CREATE TABLE IF NOT EXISTS public.user_quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quiz_id UUID REFERENCES public.user_quizzes(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL, -- Store user answers as JSON
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER, -- Time in seconds
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_cloud_connections table for tracking cloud storage connections
CREATE TABLE IF NOT EXISTS public.user_cloud_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cloud_provider TEXT NOT NULL CHECK (cloud_provider IN ('onedrive', 'googledrive', 'icloud', 'supabase')),
    provider_user_id TEXT, -- User ID from the cloud provider
    provider_email TEXT,
    access_token_encrypted TEXT, -- Encrypted access token
    refresh_token_encrypted TEXT, -- Encrypted refresh token
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, cloud_provider)
);

-- Create user_activity_log table for tracking all user actions
CREATE TABLE IF NOT EXISTS public.user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL, -- 'folder_create', 'file_upload', 'quiz_generate', 'cloud_connect', etc.
    action_details JSONB, -- Additional details about the action
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Row Level Security Policies
-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- User Folders
CREATE POLICY "Users can view own folders" ON public.user_folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders" ON public.user_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON public.user_folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON public.user_folders
    FOR DELETE USING (auth.uid() = user_id);

-- User Files
CREATE POLICY "Users can view own files" ON public.user_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own files" ON public.user_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON public.user_files
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON public.user_files
    FOR DELETE USING (auth.uid() = user_id);

-- User Quizzes
CREATE POLICY "Users can view own quizzes" ON public.user_quizzes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quizzes" ON public.user_quizzes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Quiz Attempts
CREATE POLICY "Users can view own quiz attempts" ON public.user_quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quiz attempts" ON public.user_quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Cloud Connections
CREATE POLICY "Users can view own cloud connections" ON public.user_cloud_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cloud connections" ON public.user_cloud_connections
    FOR ALL USING (auth.uid() = user_id);

-- User Activity Log
CREATE POLICY "Users can view own activity" ON public.user_activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity" ON public.user_activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cloud_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_user_folders_updated_at
    BEFORE UPDATE ON public.user_folders
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_user_files_updated_at
    BEFORE UPDATE ON public.user_files
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_folders_user_id ON public.user_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON public.user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quizzes_user_id ON public.user_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_id ON public.user_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cloud_connections_user_id ON public.user_cloud_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;