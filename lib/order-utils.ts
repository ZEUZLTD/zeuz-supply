import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';

// Initialize instances here or inject them
// For a utility file, it's often better to initialize standard ones if environment vars are available.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// Resend might not be initialized if key missing in some envs, handle gracefully?
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Initialize Admin Client once
const supabaseAdmin = new SupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handleOrderCompletion(session: Stripe.Checkout.Session) {
    console.log(`Processing Order: ${session.id}`);

    // Check if order already exists to prevent duplicates (Idempotency)
    const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

    if (existingOrder) {
        console.log(`Order ${session.id} already processed.`);
        return { success: true, alreadyExists: true, orderId: existingOrder.id };
    }

    if (!session.id) return { error: 'No session ID' };

    // Retrieve Line Items
    const sessionWithItems = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items']
    });

    const lineItems = sessionWithItems.line_items?.data || [];
    let stockFailed = false;
    let failedItemName = '';

    // STOCK DECREMENT LOGIC
    for (const item of lineItems) {
        if (stockFailed) break;
        if (!item.price?.product) continue;

        const stripeProduct = await stripe.products.retrieve(item.price.product as string);
        const supabaseId = stripeProduct.metadata.supabase_id || stripeProduct.metadata.id;

        if (!supabaseId) {
            console.warn(`No Supabase ID found for product ${item.description} - Skipping inventory check`);
            // We do NOT fail here because early legacy items might validly have no ID.
            // But for v2, we should probably ensure it.
            continue;
        }

        // Find FIRST batch with enough stock (FIFO)
        const { data: batches } = await supabaseAdmin
            .from('batches')
            .select('id, stock_quantity')
            .eq('product_id', supabaseId)
            .eq('status', 'LIVE')
            .gt('stock_quantity', 0)
            .order('created_at', { ascending: true });

        if (!batches || batches.length === 0) {
            stockFailed = true;
            failedItemName = item.description || 'Unknown Item';
            break;
        }

        let qtyToFill = item.quantity || 1;

        for (const batch of batches) {
            if (qtyToFill <= 0) break;

            const take = Math.min(batch.stock_quantity, qtyToFill);

            // Atomic Update
            const { error: updateError, count } = await supabaseAdmin
                .from('batches')
                .update({ stock_quantity: batch.stock_quantity - take })
                .eq('id', batch.id)
                .eq('stock_quantity', batch.stock_quantity) // Optimistic Lock
                .select();

            if (updateError || count === 0) {
                // Race condition hit
                // In strict mode, we fail.
                stockFailed = true;
                failedItemName = item.description || 'Unknown Item';
                break;
            }

            qtyToFill -= take;
        }

        if (qtyToFill > 0) {
            stockFailed = true;
            failedItemName = item.description || 'Unknown Item';
        }
    }

    if (stockFailed) {
        console.error(`Concurrency Conflict: Refunding Order ${session.id} due to ${failedItemName}`);

        // Refund
        if (session.payment_intent) {
            await stripe.refunds.create({
                payment_intent: session.payment_intent as string,
                reason: 'requested_by_customer', // Best fit
            });
        }

        // Apology Email
        const email = session.customer_details?.email;
        if (email && resend) {
            const { sendTransactionalEmail } = await import('@/lib/email');
            await sendTransactionalEmail({
                key: 'stock_apology',
                to: email,
                data: { item_name: failedItemName }
            });
        }

        // Insert Refunded Order Record
        await supabaseAdmin.from('orders').insert({
            stripe_session_id: session.id,
            customer_email: session.customer_details?.email,
            status: 'REFUNDED_NO_STOCK',
            amount_total: session.amount_total,
            currency: session.currency,
            items: lineItems
        });

        return { error: 'Stock Validation Failed', refunded: true };
    }

    // Success: Insert Order
    const { data: insertedOrder, error: orderError } = await supabaseAdmin.from('orders').insert({
        stripe_session_id: session.id,
        customer_email: session.customer_details?.email,
        shipping_address: session.customer_details?.address,
        status: session.payment_status === 'paid' ? 'PAID' : 'PENDING',
        amount_total: session.amount_total,
        currency: session.currency,
        items: lineItems
    }).select().single();

    if (orderError) {
        console.error('Supabase Order Error:', orderError);
        return { error: 'Database Insert Failed' };
    }

    // Mark Abandoned Cart as CONVERTED
    if (session.customer_details?.email) {
        await supabaseAdmin
            .from('checkouts')
            .update({ status: 'CONVERTED' })
            .eq('email', session.customer_details.email)
            .eq('status', 'OPEN');
    }

    // Send Receipt Email
    const email = session.customer_details?.email;
    if (email) {
        const { sendTransactionalEmail } = await import('@/lib/email');
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

    return { success: true, order: insertedOrder };
}
