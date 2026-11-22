import { createClient } from '@supabase/supabase-js';
import { PROJECT_URL, PUBLISHABLE_KEY } from '@/lib/config/public';
export const SUPABASE_CONFIGURED = true;
/** Auth session persistence is handled by Supabase; gym records are never stored in this browser. */
export const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || PROJECT_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PUBLISHABLE_KEY,
);
