import { createClient } from '@supabase/supabase-js';

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;

const normalizeEnvValue = (value: string | undefined) => value?.trim();
const parseEnvBoolean = (value: string | undefined) => {
  const normalized = normalizeEnvValue(value)?.toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
};

const configuredSupabaseUrl = normalizeEnvValue(env.VITE_SUPABASE_URL);
const configuredSupabaseAnonKey = normalizeEnvValue(env.VITE_SUPABASE_ANON_KEY);

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

export const isGithubOAuthEnabled = parseEnvBoolean(env.VITE_SUPABASE_GITHUB_ENABLED);
export const isGoogleOAuthEnabled = parseEnvBoolean(env.VITE_SUPABASE_GOOGLE_ENABLED);
