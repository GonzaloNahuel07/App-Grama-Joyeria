import { z } from 'zod';

const envSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).default('Grama Joyería'),
});

/**
 * Validated runtime environment configuration exposed to the client bundle.
 */
export const env = envSchema.parse({
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || undefined,
});
