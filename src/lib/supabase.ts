import { createClient } from '@supabase/supabase-js';

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;

const configuredSupabaseUrl = env.VITE_SUPABASE_URL;
const configuredSupabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(configuredSupabaseUrl && configuredSupabaseAnonKey);

const supabaseUrl = configuredSupabaseUrl ?? 'https://example.supabase.co';
const supabaseAnonKey = configuredSupabaseAnonKey ?? 'missing-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isGithubOAuthEnabled = env.VITE_SUPABASE_GITHUB_ENABLED === 'true';
