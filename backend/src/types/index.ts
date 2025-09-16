// Type definitions for StudyAI Backend
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

// =============================================================================
// USER & AUTHENTICATION TYPES
// =============================================================================

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  plan_type: 'free' | 'premium' | 'enterprise';
  storage_used: number;
  storage_quota: number;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export interface AuthenticatedRequest extends Request {
  user: User;
  session?: UserSession;
}

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// =============================================================================
// CLOUD STORAGE TYPES
// =============================================================================

export type CloudProvider = 'onedrive' | 'googledrive' | 'icloud' | 'supabase';

export interface CloudFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'file' | 'folder';
  mimeType?: string;
  modifiedTime: string;
  createdTime: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  parentId?: string;
}

export interface CloudFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  children?: (CloudFile | CloudFolder)[];
  createdTime: string;
  modifiedTime: string;
}

export interface CloudStorageInfo {
  provider: CloudProvider;
  connected: boolean;
  used: number;
  total: number;
  quota?: number;
  userInfo?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export interface CloudStorageOperationResult {
  success: boolean;
  data?: any;
  error?: string;
  errorCode?: string;
}

// =============================================================================
// CONTENT & QUIZ TYPES
// =============================================================================

export interface Content {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  file_path: string;
  file_type: 'pdf' | 'video' | 'audio' | 'text';
  file_size: number;
  upload_status: 'pending' | 'processing' | 'completed' | 'error';
  extracted_text?: string;
  ai_summary?: string;
  topics?: string[];
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  description?: string;
  difficulty_level: number;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  description?: string;
  difficulty: number;
  questions: QuizQuestion[];
  time_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  topic_id: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
  order_index: number;
}

export interface QuizResponse {
  id: string;
  user_id: string;
  quiz_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  points_earned: number;
  time_taken?: number;
  answered_at: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  quiz_id: string;
  started_at: string;
  completed_at?: string;
  score: number;
  max_score: number;
  time_taken?: number;
  responses: QuizResponse[];
}

// =============================================================================
// AI PROVIDER TYPES
// =============================================================================

export type AIProvider = 'openai' | 'google' | 'anthropic';

export interface AIProviderConfig {
  name: string;
  enabled: boolean;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface AIAnalysisResult {
  topics: string[];
  summary: string;
  difficulty: number;
  keyPoints: string[];
  suggestedQuestions: Partial<QuizQuestion>[];
}

export interface AIQuizGenerationRequest {
  content: string;
  subject: string;
  difficulty: number;
  questionCount: number;
  questionTypes: QuizQuestion['question_type'][];
}

// =============================================================================
// DATABASE TYPES
// =============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    idle: number;
  };
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface PerformanceAnalytics {
  id: string;
  user_id: string;
  subject_id: string;
  topic_id: string;
  date: string;
  questions_attempted: number;
  questions_correct: number;
  average_time: number;
  difficulty_level: number;
  accuracy_rate: number;
}

// =============================================================================
// ENVIRONMENT & CONFIG TYPES
// =============================================================================

export interface EnvironmentConfig {
  // Server
  PORT: number;
  HOST: string;
  NODE_ENV: 'development' | 'production' | 'test';
  
  // URLs
  FRONTEND_URL: string;
  PUBLIC_BACKEND_URL: string;
  
  // Database
  DATABASE_URL: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // AI Providers
  OPENAI_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  DEFAULT_AI_PROVIDER: AIProvider;
  
  // Cloud Storage
  ONEDRIVE_CLIENT_ID?: string;
  ONEDRIVE_CLIENT_SECRET?: string;
  GOOGLE_DRIVE_CLIENT_ID?: string;
  GOOGLE_DRIVE_CLIENT_SECRET?: string;
  
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY?: string;
  
  // File Upload
  MAX_FILE_SIZE: string;
  UPLOAD_DIR: string;
  ALLOWED_FILE_TYPES: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Partial<Pick<T, K>>;

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  message?: string;
}

export interface FileUploadInfo {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface AppError extends Error {
  statusCode: number;
  code?: string;
  isOperational: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface RequestValidationError extends AppError {
  errors: ValidationError[];
}