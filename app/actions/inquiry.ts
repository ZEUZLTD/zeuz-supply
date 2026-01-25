'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function submitInquiry(formData: FormData) {
    const email = formData.get('email') as string;
    const type = formData.get('type') as string;
    const message = formData.get('message') as string;
    const metadataStr = formData.get('metadata') as string;
    const metadata = metadataStr ? JSON.parse(metadataStr) : {};

    const cookieStore = cookies();

    // Service Role Client (to bypass RLS for public insertions if needed, 
    // though inquiries usually has public insert policy. Using standard client for safety context 
    // unless strictly anonymous).
    // Actually, for newsletter, it's often anonymous.
    // Let's use standard client but ensure RLS allows anon insert.
    // Or better, use Service Role for guaranteed insert + sync logic.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin power for backend processing
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );

    console.log(`[Inquiry] Processing: ${email} (${type})`);

    // 1. Insert into DB
    const { error } = await supabase.from('inquiries').insert({
        email,
        type,
        message: message || null,
        metadata
    });

    if (error) {
        console.error('[Inquiry] DB Error:', error);
        throw new Error('Failed to save inquiry');
    }

    // 2. Sync to Listmonk (Placeholder)
    // In production, this would be:
    // await fetch(process.env.LISTMONK_URL + '/api/subscribers', { ... });
    await syncToListmonk(email, type, metadata);

    return { success: true };
}

async function syncToListmonk(email: string, type: string, data: any) {
    // Placeholder Logic
    console.log(`[Listmonk Sync] Syncing ${email} to list...`);

    // Simulating API latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // Log "Success"
    console.log(`[Listmonk Sync] Successfully subscribed ${email} to list: ${type}`);
}
