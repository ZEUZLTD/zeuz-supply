
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Use Service Role Key for Admin privileges (bypass RLS for Orders/Checkouts)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Webhook Error: ${message}`);
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            await handleOrderCompletion(session);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

async function handleOrderCompletion(session: Stripe.Checkout.Session) {
    console.log(`Processing Order: ${session.id}`);

    // 1. Retrieve Line Items to get product details
    if (!session.id) return;

    // We need to expand line_items to see what was bought
    const sessionWithItems = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items']
    });
    // const lineItems = sessionWithItems.line_items?.data || [];

    // 2. Insert Order into Supabase
    const { error: orderError } = await supabaseAdmin.from('orders').insert({
        stripe_session_id: session.id,
        customer_email: session.customer_details?.email,
        shipping_address: session.customer_details?.address,
        status: session.payment_status === 'paid' ? 'PAID' : 'PENDING',
        amount_total: session.amount_total,
        currency: session.currency,
        items: sessionWithItems.line_items?.data || []
    });

    if (orderError) console.error('Supabase Order Error:', orderError);

    // 3. Mark Abandoned Cart as CONVERTED
    // prevents sending recovery emails to people who just bought.
    if (session.customer_details?.email) {
        const { error: checkoutError } = await supabaseAdmin
            .from('checkouts')
            .update({ status: 'CONVERTED' })
            .eq('email', session.customer_details.email)
            .eq('status', 'OPEN');

        if (checkoutError) console.error('Failed to convert checkout:', checkoutError);
        else console.log(`Checkout converted for ${session.customer_details.email}`);
    }

    // 4. Send Receipt Email
    const email = session.customer_details?.email;
    if (email) {
        // Dynamic Template Sending
        const { sendTransactionalEmail } = await import('@/lib/email'); // Dynamic import to avoid circular dep issues if any, though standard import is fine.

        await sendTransactionalEmail({
            key: 'order_confirmation',
            to: email,
            data: {
                order_id: session.id,
                total: (session.amount_total || 0) / 100,
                currency: session.currency?.toUpperCase()
            }
        });
    }
}
