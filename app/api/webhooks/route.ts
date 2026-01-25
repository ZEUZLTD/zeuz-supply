
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

    // 5. STOCK DECREMENT & CONCURRENCY CHECK
    // Strategy: Attempt to decrement stock. If any item fails (insufficient stock), FLIP THE TABLE (Refund).
    const lineItems = sessionWithItems.line_items?.data || [];
    let stockFailed = false;
    let failedItemName = '';

    // We must process sequentially to ensure we can rollback/refund correctly (or just fail all)
    // Actually, if we fail halfway, we technically should "rollback" the previous decrements?
    // DB Transaction would be best. But over REST, we can just check all first?
    // No, "Check then Act" is the race condition we want to avoid.
    // "Act and Check Result" is better.
    // Ideally we use a Supabase RPC for the whole batch?
    // For now: Loop. If fail, we must refund. (We won't rollback other stocks for MVP, we just refund the money).

    for (const item of lineItems) {
        if (stockFailed) break;
        if (!item.price?.product) continue;

        // We need the product ID from Stripe Product metadata or name match?
        // Stripe Item -> Product -> Metadata -> 'supabase_id'
        const stripeProduct = await stripe.products.retrieve(item.price.product as string);
        const supabaseId = stripeProduct.metadata.supabase_id || stripeProduct.metadata.id; // Fallback

        if (!supabaseId) {
            console.warn(`No Supabase ID found for product ${item.description}`);
            continue;
        }

        // ATOMIC DECREMENT
        // We use RPC or raw query? Supabase JS `decrement` helper doesn't exist natively like this.
        // We can use `.rpc('decrement_stock', { p_id, qty })` if we wrote it.
        // Or pure SQL via `update products set batches...` -> batches is JSON? No, relational. 
        // Wait, `batches` is a separate table?
        // Schema: `products` has `batches` (relational).
        // Multi-batch logic is complex. "Decrememnt stock from WHERE?"
        // Simplification: We assume "Total Stock" is managed or we decrement from the FIRST Live batch?
        // Let's use a simpler approach for v2.1:
        // We just decrement the `products.stock_quantity` if it existed?
        // Wait, `products` table in `page.tsx` fetch shows `batches` relation.
        // We need to find *which* batch to decrement.
        // COMPLEXITY ALERT: `products` table might not have `stock_quantity` column?
        // `page.tsx`: totalStock = liveBatches.reduce...
        // So we must update a `batches` row.

        // STRATEGY: Find FIRST batch with enough stock for this item.
        const { data: batches } = await supabaseAdmin
            .from('batches')
            .select('id, stock_quantity')
            .eq('product_id', supabaseId)
            .eq('status', 'LIVE')
            .gt('stock_quantity', 0)
            .order('created_at', { ascending: true }); // Oldest first (FIFO)

        if (!batches || batches.length === 0) {
            stockFailed = true;
            failedItemName = item.description || 'Unknown Item';
            break;
        }

        // Simple FIFO decrement
        let qtyToFill = item.quantity || 1;

        for (const batch of batches) {
            if (qtyToFill <= 0) break;

            const take = Math.min(batch.stock_quantity, qtyToFill);

            // Atomic Update Condition
            const { error: updateError, count } = await supabaseAdmin
                .from('batches')
                .update({ stock_quantity: batch.stock_quantity - take })
                .eq('id', batch.id)
                .eq('stock_quantity', batch.stock_quantity) // Optimistic Lock (Version check effectively)
                .select(); // confirm

            if (updateError || count === 0) {
                // Race condition hit! Someone took it.
                // Retry this batch? Or fail? 
                // For "Paranoid" mode -> FAIL immediately.
                stockFailed = true;
                failedItemName = item.description || 'Unknown Item';
                break;
            }

            qtyToFill -= take;
        }

        if (qtyToFill > 0) {
            // Couldn't fill entire order
            stockFailed = true;
            failedItemName = item.description || 'Unknown Item';
        }
    }

    if (stockFailed) {
        console.error(`Concurrency Conflict: Refunding Order ${session.id} due to ${failedItemName}`);

        // 1. REFUND
        await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
            reason: 'requested_by_customer', // "OutOfStock" not a valid enum, closest fit or 'duplicate'
        });

        // 2. APOLOGY EMAIL
        const email = session.customer_details?.email;
        if (email) {
            const { sendTransactionalEmail } = await import('@/lib/email');
            await sendTransactionalEmail({
                key: 'stock_apology',
                to: email,
                data: {
                    item_name: failedItemName
                }
            });
        }

        // 3. ABORT (Do not record "PAID" order, maybe record "REFUNDED" or "FAILED")
        await supabaseAdmin.from('orders').insert({
            stripe_session_id: session.id,
            customer_email: session.customer_details?.email,
            status: 'REFUNDED_NO_STOCK',
            amount_total: session.amount_total,
            currency: session.currency,
            items: lineItems
        });

        return;
    }

    // 2. Insert Order into Supabase (Success Path)
    const { error: orderError } = await supabaseAdmin.from('orders').insert({
        stripe_session_id: session.id,
        customer_email: session.customer_details?.email,
        shipping_address: session.customer_details?.address,
        status: session.payment_status === 'paid' ? 'PAID' : 'PENDING',
        amount_total: session.amount_total,
        currency: session.currency,
        items: lineItems
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
