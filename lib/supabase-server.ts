import { createClient } from '@supabase/supabase-js';

// Dedicated Server Client for Static Generation / ISR
// This bypasses the browser cookie layer for pure data fetching
// function for lazy evaluation
export const getSupabaseServer = () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // during build, return null or throw if critical
        console.warn("Supabase Server Client missing env vars");
        // Return a dummy or null, but types might conflict. 
        // Better to throw if actually CALLED, but build won't call it unless executing data fetching.
        // We can throw here, but inside the function.
        // If build calls it, it will crash, but hopefully build static generation happens when env vars ARE present?
        // No, user issue is missing env vars during build.
        // So we return null? 
        // But consumers expect client.
        // Let's return null and let consumers handle?
        // Or throw only if truly missing.
        // But wait, user said "Supabase env vars missing".
        // If I throw here, it crashes.
        // If I return null, I need to update types.
        // Let's TRY to return a "mock" if missing?
        // Or just allow throw but ONLY when called.
        // The top-level execution was the problem.
        // Moving to function fixes top-level execution.
        if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            // In Vercel build, if we are statically generating pages that need data, we need keys.
            // But if we are just compiling, we don't need to execute this.
            // Making it a function prevents execution.
        }
        throw new Error("Supabase Env Vars Missing");
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY!
    );
};
