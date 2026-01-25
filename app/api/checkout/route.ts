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
        const { items, email, shipping, voucherCode } = body;

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
        // USE SERVICE ROLE KEY FOR STRICT VERIFICATION (Bypasses RLS)
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const ids = items.map((i: any) => i.id);

        // Split IDs into UUIDs and Slugs to prevent DB crashes
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validUuids = ids.filter((id: string) => uuidRegex.test(id));
        const potentialSlugs = ids.filter((id: string) => !uuidRegex.test(id));

        const productPromises = [];

        if (validUuids.length > 0) {
            productPromises.push(
                supabase.from('products').select('id, price_gbp, name, slug').in('id', validUuids)
            );
        }

        if (potentialSlugs.length > 0) {
            productPromises.push(
                supabase.from('products').select('id, price_gbp, name, slug').in('slug', potentialSlugs)
            );
        }

        const results = await Promise.all(productPromises);
        let products: any[] = [];
        let dbError: any = null;

        results.forEach(res => {
            if (res.data) products = [...products, ...res.data];
            if (res.error) dbError = res.error; // Capture last error
        });

        // Dedup results if necessary (unlikely if inputs distinct, but safe)
        products = Array.from(new Map(products.map(item => [item.id, item])).values());

        if (dbError || products.length === 0) {
            console.error("Database Error or No Products Found", dbError);
            return NextResponse.json({ error: `Price Verification Failed: ${dbError?.message || 'Product Not Found'}` }, { status: 500 });
        }

        // --- FETCH ACTIVE VOLUME DISCOUNTS ---
        const { data: volumeTiers } = await supabase
            .from('volume_discounts')
            .select('min_quantity, discount_percent')
            .eq('active', true)
            .order('min_quantity', { ascending: true });

        // --- VOUCHER VALIDATION ---
        let voucher: any = null;
        if (voucherCode) {
            const { data: vData } = await supabase
                .from('vouchers')
                .select('*')
                .ilike('code', voucherCode)
                .maybeSingle();

            if (vData) {
                // Validate Active / Expiry
                const now = new Date();
                const isExpired = (vData.expires_at && now > new Date(vData.expires_at)) ||
                    (vData.expiration_date && now > new Date(vData.expiration_date)); // Handle legacy/alt naming

                const isUsageLimitReached = vData.max_global_uses && (vData.used_count || 0) >= vData.max_global_uses;

                if (vData.active && !isExpired && !isUsageLimitReached) {
                    voucher = vData;
                    // Compatibility: Derive 'value' if not present (logic from vouchers.ts)
                    if (voucher.value === undefined || voucher.value === null) {
                        voucher.value = voucher.type === 'PERCENT' ? voucher.discount_percent : voucher.discount_amount;
                    }
                }
            }
        }

        // Rebuild Line Items using TRUSTED database data
        let voucherDiscountTotal = 0;
        let usageQuota = voucher ? (voucher.max_usage_per_cart ?? 999999) : 0;

        const lineItems = items.map((clientItem: any) => {
            const dbProduct = products.find(p => p.id === clientItem.id || p.slug === clientItem.id);
            if (!dbProduct) {
                // Determine if we should fail or skip. Failing is safer.
                throw new Error(`Product ${clientItem.model || clientItem.id} no longer available`);
            }

            // Trusted Price Calculation
            let finalPrice = dbProduct.price_gbp;

            // 1. VOLUME DISCOUNTS (Dynamic DB Check)
            let volDiscount = 0;
            const q = clientItem.quantity;

            if (volumeTiers && volumeTiers.length > 0) {
                // Find highest matching tier
                // sort descending just in case DB sort failed
                const activeTier = volumeTiers
                    .sort((a: any, b: any) => b.min_quantity - a.min_quantity)
                    .find((t: any) => q >= t.min_quantity);

                if (activeTier) {
                    volDiscount = activeTier.discount_percent / 100;
                }
            }

            finalPrice = finalPrice * (1 - volDiscount);

            // 2. VOUCHER ITEM-LEVEL DISCOUNTS
            if (voucher) {
                // Check Product Whitelist
                const isWhitelisted = !voucher.product_ids || voucher.product_ids.length === 0 ||
                    (Array.isArray(voucher.product_ids) && voucher.product_ids.some((pid: string) =>
                        pid.toLowerCase() === dbProduct.id.toLowerCase() ||
                        (dbProduct.slug && pid.toLowerCase() === dbProduct.slug.toLowerCase()) ||
                        (dbProduct.name && pid.toLowerCase() === dbProduct.name.toLowerCase())
                    ));

                if (isWhitelisted) {
                    const qtyToDiscount = Math.min(clientItem.quantity, usageQuota);
                    if (qtyToDiscount > 0) {
                        let itemSavings = 0;
                        const vType = voucher.type || (voucher.discount_percent > 0 ? 'PERCENT' : 'FIXED');

                        if (vType === 'FIXED_PRICE') {
                            if (finalPrice > (voucher.value || 0)) {
                                itemSavings = (finalPrice - (voucher.value || 0)); // Per unit savings
                            }
                        } else if (vType === 'PERCENT') {
                            itemSavings = finalPrice * ((voucher.discount_percent || 0) / 100);
                        }

                        // Apply savings to the *aggregate* - Simplest way for Stripe is to adjust unit amount average?
                        // OR: Just calculate total for this line and divide by qty? 
                        // Issue: Stripe wants unit_amount. If we have partial discount (2 of 5 items), unit price isn't uniform.
                        // Solution A: Split line item. (Complex).
                        // Solution B: Average it out (Stripe allows ints only).
                        // Better Solution: Apply discount as "total amount reduction" logic later?
                        // Actually, let's just reduce the unit price for ALL items if the quota covers them all, 
                        // or split the line item if strictly needed.
                        // User's code simple version: just reduce unit price assuming average?
                        // Let's implement SPLIT LINE ITEM logic if partial?

                        // SIMPLIFICATION FOR ROBUSTNESS: 
                        // Calculate total line cost (Net) -> Divide by Qty -> Round.
                        // (Net Cost = (Price * (Qty - DiscountedQty)) + ((Price - Savings) * DiscountedQty))

                        const totalLineCostOriginal = finalPrice * clientItem.quantity;
                        const totalSavingsForLine = itemSavings * qtyToDiscount;

                        const netLineCost = totalLineCostOriginal - totalSavingsForLine;

                        // New Unit Amount
                        finalPrice = netLineCost / clientItem.quantity;

                        usageQuota -= qtyToDiscount;
                    }
                }
            }

            return {
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: dbProduct.name,
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

        // Validation: Min Spend
        if (voucher && voucher.min_spend && trustedSubtotal < voucher.min_spend) {
            // Remove voucher effects? Or throw?
            // Throwing is better feedback than silently removing for "security" but confusing user.
            // Client should have caught this, but if they bypassed check:
            throw new Error(`Minimum spend of £${voucher.min_spend} not met`);
        }

        // Shipping Logic
        let shippingCost = trustedSubtotal > 50 ? 0 : 5.00;

        // Voucher Free Shipping
        if (voucher && voucher.is_free_shipping) {
            shippingCost = 0;
        }

        // Voucher Fixed Global Discount (e.g. £10 off total)
        let globalDiscountAmount = 0;
        if (voucher && (voucher.type === 'FIXED' || (!voucher.type && voucher.discount_amount > 0))) {
            globalDiscountAmount = voucher.discount_amount || voucher.value || 0;
        }

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

        // Handle Global Fixed Discount via Coupon or fake negative line item?
        // Stripe Coupons are best, but we are doing "Server-Side Calc".
        // Negative line items are not supported well in Checkout.
        // Best approach: Create a Stripe Coupon on the fly? Or use 'discounts' array with ad-hoc?
        // Actually, Stripe Checkout supports `discounts: [{ coupon: ... }]`.
        // Creating a coupon API call is extra latency.
        // Alternative: Distribute the fixed discount across items?
        // Or: Use `coupon` if we have a matching Stripe Coupon ID.
        // Given constraint: "We do not program every voucher in Stripe."
        // Strategy: "Stripe Coupon Object" allows ad-hoc? No, must exist.
        // FALLBACK STRATEGY: Create a "Discount" line item? No, native support needed.
        // OK, for 'FIXED' global discount, effective instruction:
        // We will create a fresh Coupon-On-The-Fly for this session? 
        // OR: simpler -> We just reduce the last item price? (Messy).

        // Let's use `discounts` -> `coupon_data` (Stripe API allows creating one-time coupon inline? 
        // No, `coupon` ID required. But `discounts` -> `coupon` -> CHECKOUT SESSION allows creating `coupons`?
        // Wait, `discounts` in Session Create params accepts `{ coupon: string }` OR `{ promotion_code: string }`.

        // PROPER SOLUTION FOR FIXED CART DISCOUNT WITHOUT STRIPE OBJECTS:
        // Distribute the discount across line items proportionally.
        if (globalDiscountAmount > 0) {
            const totalCents = lineItems.reduce((sum: number, i: any) => sum + (i.price_data.unit_amount * i.quantity), 0);
            const discountCents = Math.round(globalDiscountAmount * 100);

            if (totalCents > 0) {
                let remainingDiscount = discountCents;

                lineItems.forEach((item: any) => {
                    const itemTotal = item.price_data.unit_amount * item.quantity;
                    const proportion = itemTotal / totalCents;
                    const itemShare = Math.round(discountCents * proportion);

                    // Apply share
                    const newTotal = Math.max(0, itemTotal - itemShare);
                    item.price_data.unit_amount = Math.round(newTotal / item.quantity);

                    remainingDiscount -= itemShare;
                });
            }
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
                shipping_details: JSON.stringify(shipping),
                voucher_code: voucher ? voucher.code : null
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe/Checkout Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
