import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../shared/lib/env';

/**
 * Shared Supabase browser client, or null when running in Local Mode without credentials.
 */
export const supabase: SupabaseClient | null =
  isSupabaseConfigured && env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY
    ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
    : null;
