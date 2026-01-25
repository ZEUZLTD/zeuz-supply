const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

async function processAbandonedCarts() {
    console.log("Checking for abandoned carts...");

    // 1 hour ago
    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: carts, error } = await supabase
        .from('checkouts')
        .select('*')
        .eq('status', 'OPEN')
        .lt('last_active', cutoff);

    if (error) {
        console.error("Error fetching carts:", error);
        return;
    }

    console.log(`Found ${carts.length} abandoned carts.`);

    for (const cart of carts) {
        console.log(`Processing cart for: ${cart.email}`);

        // 1. Send Email
        // 1. Send Email
        try {
            // Fetch Template
            const { data: template, error: templateError } = await supabase
                .from('email_templates')
                .select('*')
                .eq('key', 'abandoned_cart')
                .single();

            if (templateError || !template) {
                console.error("Template 'abandoned_cart' not found. Skipping email.");
                continue;
            }

            // Replace Variables
            const cartUrl = `${process.env.NEXT_PUBLIC_URL}/cart?recovery=${cart.id}`;
            let subject = template.subject;
            let html = template.body_html.replace('{{cart_url}}', cartUrl);

            const { data, error } = await resend.emails.send({
                from: 'Zeuz Supply <onboarding@resend.dev>',
                to: [cart.email],
                subject: subject,
                html: html
            });

            if (error) {
                console.error("Email failed:", error);
                // We typically still update status or mark as 'FAILED_EMAIL' to avoid infinite retry loop
            } else {
                console.log("Email sent:", data);
            }
        } catch (emailErr) {
            console.error("Email exception:", emailErr);
        }

        // 2. Update status
        const { error: updateError } = await supabase
            .from('checkouts')
            .update({ status: 'ABANDONED' })
            .eq('id', cart.id);

        if (updateError) {
            console.error("Failed to update status:", updateError);
        } else {
            console.log("Status updated to ABANDONED.");
        }
    }
}

processAbandonedCarts();
