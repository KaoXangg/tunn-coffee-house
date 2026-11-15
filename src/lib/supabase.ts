import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(rawUrl: string): string {
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return rawUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }
}

export const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-public-anon-key')
);

// Initialize Supabase Client safely (falls back to placeholder URL when env is not yet configured so app doesn't crash on boot)
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const STORAGE_BUCKET = 'tunn-media';
