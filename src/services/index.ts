import { supabase } from './supabaseClient';
import { localRepository } from './localRepository';
import { supabaseRepository } from './supabaseRepository';
import type { StoreRepository } from './storeRepository';

/**
 * Active store repository selected automatically based on environment configuration.
 */
export const storeService: StoreRepository = supabase ? supabaseRepository : localRepository;
