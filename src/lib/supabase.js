import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'materials';
export const SUPABASE_URL = url || '';
export const SUPABASE_ANON_KEY = anonKey || '';

/** Supabase sozlanganmi (.env to'ldirilganmi) */
export const isConfigured = Boolean(url && anonKey);

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
