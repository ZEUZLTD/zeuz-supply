import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const getResend = () => {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    return new Resend(process.env.RESEND_API_KEY);
};

const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.warn('Supabase env vars missing in email lib - returning null. OK during build.');
        return null;
    }
    return createClient(url, key);
};

interface SendEmailParams {
    key: string;
    to: string;
    data: Record<string, unknown>;
}

export async function sendTransactionalEmail({ key, to, data }: SendEmailParams) {
    console.log(`Sending email '${key}' to ${to}...`);

    try {
        // 1. Fetch Template
        const supabase = getSupabase();
        if (!supabase) return { success: false, error: 'Supabase client missing' };

        const { data: template, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('key', key)
            .single();

        if (error || !template) {
            console.error(`Email Template '${key}' not found or error:`, error);
            // Fallback? Or throw?
            // For now, fail safely but log loudly.
            return { success: false, error: 'Template not found' };
        }

        // 2. Replace Variables
        let subject = template.subject;
        let html = template.body_html;

        Object.entries(data).forEach(([varKey, value]) => {
            const regex = new RegExp(`{{${varKey}}}`, 'g');
            subject = subject.replace(regex, String(value));
            html = html.replace(regex, String(value));
        });

        // 3. Send via Resend
        const resend = getResend();
        const { data: resendData, error: resendError } = await resend.emails.send({
            from: 'Zeuz Supply <orders@zeuz.co.uk>', // Ensure domain is verified or use onboarding@resend.dev
            to: [to],
            subject: subject,
            html: html
        });

        if (resendError) {
            console.error('Resend Error:', resendError);
            return { success: false, error: resendError };
        }

        console.log(`Email '${key}' sent successfully.`);
        return { success: true, data: resendData };

    } catch (e) {
        console.error('Send Transactional Email Exception:', e);
        return { success: false, error: e };
    }
}

export async function sendBatchEmail(params: { from?: string, to: string[], subject: string, html: string }) {
    // For Newsletter marketing bursts
    try {
        const resend = getResend();
        const { data, error } = await resend.emails.send({
            from: params.from || 'Zeuz Supply <newsletter@zeuz.co.uk>',
            to: params.to,
            subject: params.subject,
            html: params.html
        });

        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('Batch Email Error:', e);
        return { success: false, error: e };
    }
}
