const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const TARGET_EMAIL = 'liambrt@gmail.com';
const PARTIAL_ORDER_ID = '57466fd1';

async function main() {
    try {
        console.log("Initializing Test Email Sequence...");
        console.log(`Target: ${TARGET_EMAIL}`);
        console.log(`Context Order: ${PARTIAL_ORDER_ID}...`);

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing Supabase credentials in .env.local");
        }
        if (!process.env.RESEND_API_KEY) {
            throw new Error("Missing RESEND_API_KEY in .env.local");
        }

        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const resend = new Resend(process.env.RESEND_API_KEY);

        // 1. Fetch Order Data
        console.log("Fetching Order Data...");
        // Fetch last 10 orders to find the match
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (orderError) {
            console.error("Failed to fetch orders:", orderError.message);
            process.exit(1);
        }

        const order = orders.find(o => o.id.includes(PARTIAL_ORDER_ID));

        if (!order) {
            console.error(`Order starting with ${PARTIAL_ORDER_ID} not found in recent orders.`);
            console.log("Available IDs:", orders.map(o => o.id).join(', '));
            process.exit(1);
        }
        console.log(`Found Order: ${order.id}`);

        // 2. Fetch Templates
        console.log("Fetching Templates...");
        const { data: templates, error: templateError } = await supabase
            .from('email_templates')
            .select('*');

        if (templateError) {
            console.error("Failed to fetch templates:", templateError.message);
            process.exit(1);
        }

        // 3. Prepare Data for each template
        const items = order.items || [];
        const itemsHtml = items.map((item) => `
            <div style="display: table-row; border-bottom: 1px solid #222;">
                <div style="display: table-cell; padding: 10px 0; font-size: 10px; color: #888; width: 10%;">${item.quantity}x</div>
                <div style="display: table-cell; padding: 10px 0; font-size: 12px; color: white; font-weight: bold; text-align: left;">${item.description}</div>
                <div style="display: table-cell; padding: 10px 0; font-size: 12px; color: white; text-align: right; width: 20%;">${((item.amount_total || 0) / 100).toFixed(2)}</div>
            </div>
        `).join('') || '<div style="color: #666; font-size: 10px; padding: 10px;">No items listed</div>';

        const wrapperHtml = `<div style="display: table; width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">${itemsHtml}</div>`;

        // Use the explicitly set Base URL or fall back to the generic URL variable, finally to localhost
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
        console.log(`Using Link Base URL: ${baseUrl}`);

        const orderLink = `${baseUrl}/?order_id=${order.id}`;
        const cartUrl = `${baseUrl}/cart?recovery=test`;

        const testData = {
            'order_confirmation': {
                order_id: order.id,
                total: (order.amount_total / 100).toFixed(2),
                currency: (order.currency || 'GBP').toUpperCase(),
                date: new Date(order.created_at).toLocaleDateString(),
                items_html: wrapperHtml,
                order_link: orderLink
            },
            'order_shipped': {
                order_id: order.id,
                tracking_number: 'DPD-123456789 (TEST)',
                carrier: 'DPD LOCAL',
                items_html: wrapperHtml,
                order_link: orderLink
            },
            'abandoned_cart': {
                cart_url: cartUrl
            },
            'contact_acknowledgment': {
                message_preview: "I am inquiring about the bulk voltage specifications for the 21700 series...",
                type: "WHOLESALE"
            },
            'newsletter_welcome': {},
            'order_delivered': {
                order_id: order.id,
                voucher_code: 'PROTOCOL_REWARD'
            }
        };

        // 4. Send Emails
        for (const t of templates) {
            console.log(`Sending ${t.key}...`);

            let subject = t.subject;
            let html = t.body_html;
            const data = testData[t.key] || {};

            // Replace Variables
            Object.entries(data).forEach(([varKey, value]) => {
                const regex = new RegExp(`{{${varKey}}}`, 'g');
                subject = subject.replace(regex, String(value));
                html = html.replace(regex, String(value));
            });

            try {
                const { data: res, error } = await resend.emails.send({
                    from: 'Zeuz Testing <orders@zeuz.co.uk>',
                    to: [TARGET_EMAIL],
                    subject: `[TEST] ${subject}`,
                    html: html
                });

                if (error) {
                    console.error(`ERROR sending ${t.key}:`, error);
                } else {
                    console.log(`SENT ${t.key}: ${res.id}`);
                }
            } catch (e) {
                console.error(`EXCEPTION sending ${t.key}:`, e);
            }

            // Slight delay to avoid rate limits
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("Sequence Complete.");
        process.exit(0);
    } catch (err) {
        console.error("FATAL ERROR:", err);
        process.exit(1);
    }
}

main();
