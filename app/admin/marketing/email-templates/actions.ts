'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getAdminClient() {
    const cookieStore = await cookies();

    // 1. Setup Auth Checking Client (Standard)
    const supabaseStandard = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );

    // 2. Check Admin Status
    const { data: { user } } = await supabaseStandard.auth.getUser();
    const isDevAdmin = process.env.NODE_ENV === 'development' && cookieStore.get('zeuz_dev_admin')?.value === 'true';

    let isAdmin = isDevAdmin;
    if (!isAdmin && user) {
        const { data: profile } = await supabaseStandard.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'admin') isAdmin = true;
    }

    if (!isAdmin) throw new Error('Unauthorized');

    // 3. Return Service Role Client for power
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function getTemplates() {
    try {
        const supabase = await getAdminClient();
        const { data, error } = await supabase.from('email_templates').select('*').order('updated_at', { ascending: true });
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("getTemplates error", e);
        return [];
    }
}

export async function getTemplate(id: string) {
    try {
        const supabase = await getAdminClient();
        const { data, error } = await supabase.from('email_templates').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    } catch (e) {
        console.error("getTemplate error", e);
        return null;
    }
}

export async function upsertTemplate(data: FormData) {
    const id = data.get('id') as string;
    const key = data.get('key') as string;
    const subject = data.get('subject') as string;
    const body_html = data.get('body_html') as string;
    const description = data.get('description') as string;

    const supabase = await getAdminClient();

    const payload = {
        key,
        subject,
        body_html,
        description,
        updated_at: new Date().toISOString()
    };

    let error;
    if (id && id !== 'new') {
        const res = await supabase.from('email_templates').update(payload).eq('id', id);
        error = res.error;
    } else {
        const res = await supabase.from('email_templates').insert(payload);
        error = res.error;
    }

    if (error) {
        console.error("Template Save Error", error);
        throw error;
    }

    revalidatePath('/admin/marketing/email-templates');
    redirect('/admin/marketing/email-templates');
}
