
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize clients (Note: Vercel Cron requests are server-server, so we use Service Key)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: Request) {
    // Vercel Cron Security: Check for CRON_SECRET if you set one, or just allow public triggering (optional but recommended)
    // For now, we'll keep it simple as valid CRON requests come with `Authorization: Bearer <CRON_SECRET>`
    // if configured.

    // Check Authorization Header if you have CRON_SECRET env var
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // Commented out for now to ensure ease of initial setup, but recommended for production.
    }

    try {
        console.log("Checking for abandoned carts (Cron)...");

        // 1 hour ago
        const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { data: carts, error } = await supabase
            .from('checkouts')
            .select('*')
            .eq('status', 'OPEN')
            .lt('last_active', cutoff);

        if (error) throw error;

        console.log(`Found ${carts.length} abandoned carts.`);
        let processed = 0;

        for (const cart of carts) {
            console.log(`Processing cart: ${cart.id} (${cart.email})`);

            try {
                // Fetch Template
                const { data: template } = await supabase
                    .from('email_templates')
                    .select('*')
                    .eq('key', 'abandoned_cart')
                    .single();

                if (!template) {
                    console.error("Template 'abandoned_cart' missing");
                    continue;
                }

                // Prepare Email
                const cartUrl = `${process.env.NEXT_PUBLIC_URL}/cart?recovery=${cart.id}`;
                const subject = template.subject;
                const html = template.body_html.replace('{{cart_url}}', cartUrl);

                // Send
                const { error: sendError } = await resend.emails.send({
                    from: 'Zeuz Supply <onboarding@resend.dev>',
                    to: [cart.email],
                    subject: subject,
                    html: html
                });

                if (sendError) {
                    console.error("Resend Error:", sendError);
                    continue;
                }

                // Update Status
                await supabase
                    .from('checkouts')
                    .update({ status: 'ABANDONED' }) // Mark as 'ABANDONED' (sent)
                    .eq('id', cart.id);

                processed++;

            } catch (innerErr) {
                console.error("Cart processing error:", innerErr);
            }
        }

        return NextResponse.json({ success: true, processed });
    } catch (err: any) {
        console.error("Cron Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
