import { z } from 'zod';

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined),
  z.string().optional(),
);

const envSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).default('Grama Joyería'),
  VITE_SUPABASE_URL: optionalNonEmptyString.pipe(z.string().url().optional()),
  VITE_SUPABASE_ANON_KEY: optionalNonEmptyString,
});

/**
 * Validated runtime environment configuration exposed to the client bundle.
 */
export const env = envSchema.parse({
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || undefined,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

/**
 * True when both Supabase URL and public anon key are provided in environment variables.
 */
export const isSupabaseConfigured = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
