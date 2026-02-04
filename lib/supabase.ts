import { createBrowserClient } from '@supabase/ssr'

// Create a client for the browser environment that uses cookies for session storage
export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
        global: {
            headers: {
                Accept: 'application/json'
            }
        }
    }
)
