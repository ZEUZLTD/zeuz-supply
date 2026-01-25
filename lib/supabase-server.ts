import { createClient } from '@supabase/supabase-js';

// Dedicated Server Client for Static Generation / ISR
// This bypasses the browser cookie layer for pure data fetching
export const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY!
);
