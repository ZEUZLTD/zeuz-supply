import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { CartItem } from '@/lib/store';

// Safe initialization for build environment where keys might be missing
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null as unknown as Stripe;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, email, shipping } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Empty cart" }, { status: 400 });
        }

        if (!stripe) {
            console.error("Stripe not initialized. Unknown STRIPE_SECRET_KEY.");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        // --- SECURE PRICE VERIFICATION ---
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const ids = items.map((i: any) => i.id);
        const { data: products, error: dbError } = await supabase
            .from('products')
            .select('id, price, model, stock_quantity')
            .in('id', ids);

        if (dbError || !products) {
            console.error("Database Error during checkout verification", dbError);
            return NextResponse.json({ error: "Price Verification Failed" }, { status: 500 });
        }

        // Rebuild Line Items using TRUSTED database data
        const lineItems = items.map((clientItem: any) => {
            const dbProduct = products.find(p => p.id === clientItem.id);
            if (!dbProduct) {
                throw new Error(`Product ${clientItem.id} no longer available`);
            }

            // Validate Stock (Optional: could block checkout here)
            // if (dbProduct.stock_quantity < clientItem.quantity) ...

            // Trusted Price Calculation
            let finalPrice = dbProduct.price;

            // Apply Tiered Discounts (Must match store.ts logic)
            // 1-1: 0%, 2-9: 5%, 10-49: 10%, 50-99: 15%, 100+: 20%
            let discount = 0;
            const q = clientItem.quantity;
            if (q >= 100) discount = 0.20;
            else if (q >= 50) discount = 0.15;
            else if (q >= 10) discount = 0.10;
            else if (q >= 2) discount = 0.05;

            finalPrice = finalPrice * (1 - discount);

            return {
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: dbProduct.model,
                    },
                    unit_amount: Math.round(finalPrice * 100), // Stripe expects integers (pence)
                },
                quantity: clientItem.quantity,
            };
        });

        // Calculate Trusted Subtotal
        const trustedSubtotal = lineItems.reduce((acc: number, item: any) => {
            return acc + (item.price_data.unit_amount * item.quantity);
        }, 0) / 100;

        // Shipping Logic
        const shippingCost = trustedSubtotal > 50 ? 0 : 5.00;

        // Add Shipping Line Item
        if (shippingCost > 0) {
            lineItems.push({
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: 'Shipping (DPD Next Day)',
                    },
                    unit_amount: Math.round(shippingCost * 100),
                },
                quantity: 1,
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: email,
            success_url: `${process.env.NEXT_PUBLIC_URL}/?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/`,
            metadata: {
                source: 'zeuz_v1',
                shipping_details: JSON.stringify(shipping)
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Stripe/Checkout Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
