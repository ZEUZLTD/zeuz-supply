import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use Service Role for fetching templates (public or private) to ensure we always get them server-side
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SendEmailParams {
    key: string;
    to: string;
    data: Record<string, unknown>;
}

export async function sendTransactionalEmail({ key, to, data }: SendEmailParams) {
    console.log(`Sending email '${key}' to ${to}...`);

    try {
        // 1. Fetch Template
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
        const { data: resendData, error: resendError } = await resend.emails.send({
            from: 'Zeuz Supply <orders@zeuz.supply>', // Ensure domain is verified or use onboarding@resend.dev
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
