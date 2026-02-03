import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { validateUKPostcode } from '@/lib/validation';

// Lazy Init Helpers
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY missing');
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const getSupabaseAdmin = () => {
    // During build or missing env, we shouldn't crash unless used
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.warn('Supabase env vars missing - returning null client. This is fine during build if not used.');
        return null;
    }
    return new SupabaseClient(url, key);
};

export async function handleOrderCompletion(session: Stripe.Checkout.Session) {
    console.log(`Processing Order: ${session.id}`);

    // Check if order already exists to prevent duplicates (Idempotency)
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
        console.error('Supabase Admin Client not available');
        return { error: 'Server Configuration Error' };
    }
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
    const stripe = getStripe();
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
                reason: 'requested_by_customer',
            });
        }

        // Apology Email
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const email = (session as any).customer_details?.email || (session as any).customer_email;

        if (email && process.env.RESEND_API_KEY) {
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
            customer_email: email || null,
            status: 'REFUNDED_NO_STOCK',
            amount_total: session.amount_total,
            currency: session.currency,
            items: lineItems
        });

        return { error: 'Stock Validation Failed', refunded: true };
    }

    // Parse Shipping: Prioritize Stripe Native Collection, then fallback to metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let shippingAddress = (session as any).shipping_details?.address || (session as any).customer_details?.address;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerEmail: string | null = (session as any).customer_details?.email || (session as any).customer_email || null;

    // --- SECURITY: MAINLAND CHECK (POST-CHECKOUT) ---
    // User might have switched postcode in Stripe Checkout to non-mainland.
    // We must validate and REFUND if they breached our rule.
    if (shippingAddress && shippingAddress.postal_code) {
        const valResult = validateUKPostcode(shippingAddress.postal_code);
        if (!valResult.isValid) {
            console.error(`SECURITY BLOCK: Invalid Postcode used (${shippingAddress.postal_code}) - REFUNDING`);

            // Refund
            if (session.payment_intent) {
                await stripe.refunds.create({
                    payment_intent: session.payment_intent as string,
                    reason: 'fraudulent',
                });
            }

            // Notify User
            if (customerEmail && process.env.RESEND_API_KEY) {
                const { sendTransactionalEmail } = await import('@/lib/email');
                await sendTransactionalEmail({
                    key: 'order_cancelled',
                    to: customerEmail,
                    data: {
                        reason: `Delivery to '${shippingAddress.postal_code}' is not supported (Mainland UK Only). Your order has been refunded.`
                    }
                });
            }

            // Log Failed Order
            await supabaseAdmin.from('orders').insert({
                stripe_session_id: session.id,
                customer_email: customerEmail,
                status: 'REFUNDED_INVALID_ADDRESS',
                amount_total: session.amount_total,
                currency: session.currency,
                items: lineItems,
                metadata: { ...session.metadata, invalid_reason: valResult.error }
            });

            return { error: `Order Rejected: ${valResult.error}`, refunded: true };
        }
    }

    // Legacy/Manual Check
    if (!shippingAddress && session.metadata?.shipping_details) {
        try {
            shippingAddress = JSON.parse(session.metadata.shipping_details);
        } catch (e) {
            console.error("Failed to parse shipping metadata", e);
        }
    }

    // Success: Insert Order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedOrder, error: orderError } = await supabaseAdmin.from('orders').insert({
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        customer_email: customerEmail,
        shipping_address: shippingAddress,
        status: session.payment_status === 'paid' ? 'PAID' : 'PENDING',
        amount_total: session.amount_total,
        currency: session.currency,
        items: lineItems,
        metadata: {
            ...session.metadata,
            voucher_code: session.metadata?.voucher_code
        }
    }).select().single();

    if (orderError) {
        // Handle Race Condition (Unique Constraint Violation)
        if (orderError.code === '23505') {
            const { data: racedOrder } = await supabaseAdmin
                .from('orders')
                .select('*')
                .eq('stripe_session_id', session.id)
                .single();

            if (racedOrder) {
                return { success: true, order: racedOrder, alreadyExists: true };
            }
        }

        console.error('Supabase Order Error:', orderError);
        return { error: `Database Insert Failed: ${orderError.message || orderError.hint || 'Unknown DB Error'}` };
    }

    // Mark Abandoned Cart as CONVERTED
    if (customerEmail) {
        await supabaseAdmin
            .from('checkouts')
            .update({ status: 'CONVERTED' })
            .eq('email', customerEmail)
            .eq('status', 'OPEN');
    }

    // Send Receipt Email
    if (customerEmail) {
        const itemsHtml = lineItems.map((item: Stripe.LineItem) => `
            <div style="display: table-row; border-bottom: 1px solid #222;">
                <div style="display: table-cell; padding: 10px 0; font-size: 10px; color: #888; width: 10%;">${item.quantity}x</div>
                <div style="display: table-cell; padding: 10px 0; font-size: 12px; color: white; font-weight: bold; text-align: left;">${item.description}</div>
                <div style="display: table-cell; padding: 10px 0; font-size: 12px; color: white; text-align: right; width: 20%;">${((item.amount_total || 0) / 100).toFixed(2)}</div>
            </div>
        `).join('') || '<div style="color: #666; font-size: 10px; padding: 10px;">No items listed</div>';

        const wrapperHtml = `<div style="display: table; width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">${itemsHtml}</div>`;
        const orderLink = `${process.env.NEXT_PUBLIC_BASE_URL}/?order_id=${session.id}`;

        const { sendTransactionalEmail } = await import('@/lib/email');
        await sendTransactionalEmail({
            key: 'order_confirmation',
            to: customerEmail,
            data: {
                order_id: session.id,
                total: (session.amount_total || 0) / 100,
                currency: session.currency?.toUpperCase(),
                items_html: wrapperHtml,
                order_link: orderLink
            }
        });
    }

    return { success: true, order: insertedOrder };
}
