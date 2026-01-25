'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getTemplates() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );

    const { data } = await supabase.from('email_templates').select('*').order('created_at', { ascending: true });
    return data || [];
}

export async function getTemplate(id: string) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );

    const { data } = await supabase.from('email_templates').select('*').eq('id', id).single();
    return data;
}

export async function upsertTemplate(data: FormData) {
    const id = data.get('id') as string;
    const key = data.get('key') as string;
    const subject = data.get('subject') as string;
    const body_html = data.get('body_html') as string;
    const description = data.get('description') as string;

    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );

    // RBAC
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    // Assume admin check passed via layout or middleware usually, but good to check role if needed.

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
