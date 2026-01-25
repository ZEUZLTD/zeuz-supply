"use client";

import { useCartStore, useUIStore } from "@/lib/store";
import { X, Trash2, ArrowRight, Minus, Plus, ShoppingBag, Truck, CreditCard, ChevronRight, Check, Eraser, User, Package, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { usePathname } from "next/navigation";
import { checkVoucherInternal } from "@/app/actions/vouchers";

export const CartDrawer = () => {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');

    // ... existing hooks ...

    const { items, isOpen, toggleCart, removeItem, updateQuantity, clearCart, total, subtotal, activeTab, syncPrices } = useCartStore();
    const { setThemeColor, setUser } = useUIStore();
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync Prices on Open
    useEffect(() => {
        if (isOpen) {
            syncPrices();
            const interval = setInterval(syncPrices, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [isOpen, syncPrices]);

    // Initial Sync on Mount
    useEffect(() => {
        syncPrices();
    }, [syncPrices]);

    // View State
    const [view, setView] = useState<'CART' | 'SHIPPING'>('CART');

    // Auth State
    const [session, setSession] = useState<any>(null);
    const [loginEmail, setLoginEmail] = useState("");
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);

    // Shipping State
    const [shipping, setShipping] = useState({
        email: '',
        name: '',
        line1: '',
        line2: '',
        city: '',
        postal_code: '',
        country: 'GB'
    });

    const updateShipping = (key: string, value: string) => {
        setShipping(prev => ({ ...prev, [key]: value }));
    };

    // Voucher State
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState<{
        code: string;
        type: 'PERCENT' | 'FIXED' | 'FIXED_PRICE';
        value: number;
        min_spend: number;
        is_free_shipping: boolean;
        product_ids?: string[];
        max_usage_per_cart?: number;
    } | null>(null);
    const [voucherError, setVoucherError] = useState("");
    const [isSafetyAccepted, setIsSafetyAccepted] = useState(false);
    const [isAdminUser, setIsAdminUser] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user || null);
            if (session) {
                fetchOrders();
                fetchAddress(); // Pre-fill address
                fetchTheme(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user || null);
            if (session) {
                fetchOrders();
                fetchAddress();
                fetchTheme(session.user.id);

                // Auto-Subscribe on Login (Magic Link)
                if (event === 'SIGNED_IN' && !localStorage.getItem('zeuz_subscribed')) {
                    supabase.from('inquiries').insert({
                        email: session.user.email,
                        type: 'NEWSLETTER',
                        metadata: { source: 'MAGIC_LINK_LOGIN' }
                    });
                    localStorage.setItem('zeuz_subscribed', 'true');
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchTheme = async (userId: string) => {
        const { data } = await supabase.from('profiles').select('theme_color, role').eq('id', userId).single();
        data && setIsAdminUser(data.role === 'admin');
        if (data && data.theme_color) {
            setThemeColor(data.theme_color);
        }
    };

    const fetchOrders = async () => {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (data) setOrders(data);
    };

    const fetchAddress = async () => {
        const { data } = await supabase.from('user_addresses').select('*').single();
        if (data) {
            setShipping(prev => ({
                ...prev,
                name: data.full_name,
                line1: data.line1,
                line2: data.line2 || '',
                city: data.city,
                postal_code: data.postal_code,
                country: data.country
            }));
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithOtp({
            email: loginEmail,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (!error) setMagicLinkSent(true);
        else alert("Error: " + error.message);
    };

    const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider as any,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) alert(error.message);
    };

    // HYBRID CART SYNC ENGINE
    // 1. On Login: Fetch server items & Merge
    useEffect(() => {
        const initSync = async () => {
            if (session?.user) {
                const { data: serverItems } = await supabase
                    .from('cart_items')
                    .select('*, products(*)') // Fetch product details too
                    .eq('user_id', session.user.id);

                if (serverItems && serverItems.length > 0) {
                    // Transform DB shape to Store shape
                    // We need to map DB items to CartItem. 
                    // IMPORTANT: The DB stores quantity. Product details come from join.
                    const mappedItems = serverItems.map((row: any) => ({
                        id: row.product_id,
                        model: row.products?.slug || 'UNKNOWN', // Fallback
                        price: row.products?.price_gbp || 0,
                        quantity: row.quantity,
                        stock: 9999 // We will sync prices anyway
                    }));

                    // MERGE
                    useCartStore.getState().mergeServerCart(mappedItems);
                    // Trigger immediate save of merged state back to server
                    // to ensure server is up to date with local + server union
                }
            }
        };

        if (session?.user) {
            initSync();
        }
    }, [session?.user?.id]); // Only run on user change

    // 2. On Change: Debounced Save to Server
    useEffect(() => {
        if (!session?.user) return;

        const timer = setTimeout(async () => {
            const currentItems = useCartStore.getState().items;

            // BULK UPSERT
            // We first delete all for user? Or dumb upsert?
            // Safest sync strategy for simple cart: 
            // 1. Get current IDs.
            // 2. Upsert them.
            // 3. Delete any not in current list (optional, but needed for removal sync).

            // Strategy: Delete all for user and re-insert? (Nuclear but clean)
            // or Diff?
            // Let's do: Delete All -> Insert All. 
            // Transactional would be best but simple RPC or batch is fine.

            // Better: Upsert each. And explicitly delete ones that were removed?
            // "Remove" actions in store don't track what was removed.
            // Store is source of truth.
            // So: Server state should mirror Store state.

            // NUCLEAR OPTION (Safest for consistency):
            // Delete * from cart_items where user_id = me
            // Insert all current items

            const { error: delErr } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', session.user.id);

            if (!delErr && currentItems.length > 0) {
                const payload = currentItems.map(i => ({
                    user_id: session.user.id,
                    product_id: i.id,
                    quantity: i.quantity
                }));

                await supabase.from('cart_items').insert(payload);
            }
        }, 2000); // 2s debounce

        return () => clearTimeout(timer);
    }, [items, session?.user?.id]); // Run when items change AND user is present

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setOrders([]);
        setMagicLinkSent(false);
        setLoginEmail("");
    };

    const handleApplyVoucher = async () => {
        setVoucherError("");
        if (!voucherCode) return;

        // Secure Validation (Server Action)
        let data;
        try {
            data = await checkVoucherInternal(voucherCode);
        } catch (e) {
            console.error("Voucher Check Error", e);
            setVoucherError("SYSTEM ERROR");
            return;
        }

        if (!data || !data.valid) {
            const msg = data?.error_message || "INVALID CODE";
            // Map industrial error codes
            const errorMap: Record<string, string> = {
                'CODE_NOT_FOUND': 'UNAUTHORIZED CODE',
                'VOUCHER_DISABLED': 'SYSTEM OFFLINE',
                'VOUCHER_PENDING': 'ACCESS SCHEDULED: NOT START.',
                'VOUCHER_EXPIRED': 'CODE EXPIRED',
                'USE_LIMIT_REACHED': 'GLOBAL LIMIT EXCEEDED'
            };
            setVoucherError(errorMap[msg] || msg);
            setAppliedVoucher(null);
            return;
        }

        // Validate Constraints Immediately
        const currentTotal = total();

        if (data.min_spend && currentTotal < data.min_spend) {
            setVoucherError(`REQ: SPEND £${data.min_spend}`);
            return;
        }

        // Note: Global usage limits checked in RPC. 
        // Product Logic applied in calculation.

        setAppliedVoucher({
            code: data.voucher_code,
            type: data.type,
            value: data.value,
            min_spend: data.min_spend || 0,
            is_free_shipping: data.is_free_shipping || false,
            product_ids: data.product_ids,
            max_usage_per_cart: data.max_usage_per_cart
        });
    };

    const handleCheckout = async () => {
        setIsLoading(true);

        // Final Stock Check Safeguard
        await syncPrices();
        const freshItems = useCartStore.getState().items;
        const freshViolation = freshItems.some(item => (item.stock !== undefined && item.quantity > item.stock));

        if (freshViolation) {
            alert("STOCK ERROR: Some items in your manifest are no longer available in the requested quantity. Please review your cart.");
            setIsLoading(false);
            return;
        }

        // Auto-Subscribe Logic
        const userEmail = session ? session.user.email : shipping.email;
        if (userEmail && !localStorage.getItem('zeuz_subscribed')) {
            supabase.from('inquiries').insert({
                email: userEmail,
                type: 'NEWSLETTER',
                metadata: { source: 'CHECKOUT_FLOW' }
            });
            localStorage.setItem('zeuz_subscribed', 'true');
        }

        // Save Address First if Logged In
        if (session) {
            const addressData = {
                user_id: session.user.id,
                full_name: shipping.name,
                line1: shipping.line1,
                line2: shipping.line2,
                city: shipping.city,
                postal_code: shipping.postal_code,
                country: shipping.country
            };

            // Insert/Upsert logic
            await supabase.from('user_addresses').upsert(addressData);
        }

        try {
            // LOGGING: Abandoned Cart Trigger
            // We fire this before or in parallel with fetching the checkout URL.
            // Using Promise.all to ensure we don't slow down user experience too much, 
            // but we want to capture it.
            const checkoutPayload = {
                items,
                email: session ? session.user.email : shipping.email,
                shipping: shipping
            };

            const [logRes, response] = await Promise.all([
                fetch('/api/checkout/log', {
                    method: 'POST',
                    body: JSON.stringify(checkoutPayload)
                }).catch(e => console.error("Log failed", e)), // Don't block if log fails
                fetch('/api/checkout', {
                    method: 'POST',
                    body: JSON.stringify(checkoutPayload),
                })
            ]);

            const { url } = await response.json();
            if (url) window.location.href = url;
            else alert("Checkout Configuration Error");
        } catch (error) {
            console.error("Checkout Failed", error);
            alert("Checkout Failed");
        } finally {
            setIsLoading(false);
        }
    };

    const cartTotal = total();
    const cartSubtotal = subtotal();
    const volumeSavings = cartSubtotal - cartTotal;

    // Stock Validation Check
    const hasStockViolation = items.some(item => (item.stock !== undefined && item.quantity > item.stock));

    // Voucher Calc
    let voucherDiscount = 0;

    // Shipping Logic (UK) - Default
    let shippingCost = cartTotal > 50 ? 0 : 5.00;

    if (appliedVoucher) {
        // Re-validate dynamically on render (in case cart changed)
        const currentQty = items.reduce((acc, i) => acc + i.quantity, 0);
        let isValid = true; // Assume valid unless rule broken

        // Global Constraints
        if (appliedVoucher.min_spend && cartTotal < appliedVoucher.min_spend) isValid = false;

        // Note: Global Max Qty check helps prevent applying at all if cart is too big, 
        // OR we can just ignore it here and limit per-item application below.
        // Let's enforce strict total cart limit if set (e.g. "Sample Pack - Max 2 items total")
        // vs "Max Usage Per Cart" (e.g. "Discount applies to first 2 items")
        // The DB field is `max_usage_per_cart`, which usually means "Discount applies to N items".
        // Let's assume `max_total_qty` from RPC meant "Cart cannot have more than X items".
        // But `max_usage_per_cart` is the new field. Let's stick to the new field logic:
        // "Discount applies to X units". 

        // We removed `max_total_qty` from previous RPC logic in favor of `max_usage_per_cart` application limit.

        if (isValid) {
            // Logic Fix: Allow BOTH Free Shipping AND Discount
            if (appliedVoucher.is_free_shipping) {
                shippingCost = 0;
            }

            // Calculate Item-Level Discount
            let remainingUsageQuota = appliedVoucher.max_usage_per_cart ?? 999999;

            items.forEach(item => {
                // Check Product Whitelist
                if (appliedVoucher.product_ids && appliedVoucher.product_ids.length > 0) {
                    // Check ID or Slug (assuming model/slug might match, or we need to pass IDs)
                    // CartItem has `id`, `model`. We stored slugs/ids in DB.
                    // Ideally we match fuzzy or exact. 
                    // Let's assume we match `id` or `model` (case insensitive)
                    const match = appliedVoucher.product_ids.some(pid =>
                        pid.toLowerCase() === item.id.toLowerCase() ||
                        pid.toLowerCase() === item.model.toLowerCase()
                    );
                    if (!match) return; // Skip this item
                }

                // Determine Qty to Discount for this item
                const qtyToDiscount = Math.min(item.quantity, remainingUsageQuota);

                if (qtyToDiscount > 0) {
                    let itemSavings = 0;

                    if (appliedVoucher.type === 'FIXED_PRICE') {
                        // New Price = Voucher Value
                        // Savings = (Old Price - New Price) * Qty
                        // Ensure we don't increase price
                        if (item.price > appliedVoucher.value) {
                            itemSavings = (item.price - appliedVoucher.value) * qtyToDiscount;
                        }
                    } else if (appliedVoucher.type === 'PERCENT') {
                        itemSavings = (item.price * (appliedVoucher.value / 100)) * qtyToDiscount;
                    } else {
                        // Fixed Amount Off (Per usage? Or total?)
                        // Usually Fixed Amount Off is global (e.g. £10 off total).
                        // If we want per-item fixed off, we need to specify.
                        // Standard E-comm: Fixed Amount is usually "Cart Discount".
                        // Let's treat FIXED as Cart Discount, handles outside this loop
                    }

                    voucherDiscount += itemSavings;
                    remainingUsageQuota -= qtyToDiscount;
                }
            });

            // Apply Global Fixed Discount (Only once, not per item)
            if (appliedVoucher.type === 'FIXED') {
                voucherDiscount += appliedVoucher.value;
            }
        }
    }

    // Final
    const finalTotal = Math.max(0, cartTotal - voucherDiscount + shippingCost);

    // Helper to switch tabs
    const setTab = (tab: 'cart' | 'account') => {
        useCartStore.setState({ activeTab: tab });
        if (tab === 'cart') setView('CART');
    };

    if (isAdminRoute || !mounted) return null;

    return (
        <>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleCart}
                        className="fixed inset-0 bg-black z-40 backdrop-blur-sm cursor-pointer"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--color-background)] border-l border-[var(--color-border-main)] z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header with Tabs */}
                        <div className="flex flex-col border-b border-[var(--color-border-main)]">
                            <div className="flex justify-between items-center p-4 pb-2">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold tracking-tight text-[var(--color-foreground)] font-mono-spec">
                                        ZEUZ_SYSTEM
                                    </h2>
                                    <ThemeSwitcher session={session} />
                                </div>
                                <button onClick={toggleCart} className="text-[var(--color-foreground)] hover:text-[var(--color-accent-brand)] transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-t border-[var(--color-border-main)]">
                                <button
                                    onClick={() => setTab('cart')}
                                    className={cn(
                                        "flex-1 py-3 text-xs font-mono-spec font-bold uppercase tracking-wider text-center transition-colors",
                                        activeTab === 'cart' ? "bg-[var(--color-foreground)] text-[var(--color-background)]" : "hover:bg-[var(--color-border-main)]"
                                    )}
                                >
                                    MANIFEST ({items.length})
                                </button>
                                <button
                                    onClick={() => setTab('account')}
                                    className={cn(
                                        "flex-1 py-3 text-xs font-mono-spec font-bold uppercase tracking-wider text-center transition-colors border-l border-[var(--color-border-main)]",
                                        activeTab === 'account' ? "bg-[var(--color-foreground)] text-[var(--color-background)]" : "hover:bg-[var(--color-border-main)]"
                                    )}
                                >
                                    IDENTITY
                                </button>
                            </div>
                        </div>

                        {/* CONTENT: CART */}
                        {activeTab === 'cart' && (
                            <>
                                {view === 'CART' ? (
                                    <>
                                        <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
                                            {items.length > 0 && (
                                                <div className="flex justify-end">
                                                    <button onClick={clearCart} className="text-xs font-mono-spec text-[var(--color-accent-prototype)] hover:text-[var(--color-foreground)] flex items-center gap-1">
                                                        <Eraser size={14} /> CLEAR ALL
                                                    </button>
                                                </div>
                                            )}

                                            {items.length === 0 ? (
                                                <div className="flex-1 flex items-center justify-center text-[var(--color-accent-prototype)] font-mono-spec opacity-50">
                                                    SYSTEM EMPTY...
                                                </div>
                                            ) : (
                                                items.map((item) => {
                                                    const isOutOfStock = item.stock !== undefined && item.stock <= 0;
                                                    const isOverLimit = item.stock !== undefined && item.quantity > item.stock && item.stock > 0;

                                                    return (
                                                        <div key={item.id} className={cn(
                                                            "flex flex-col gap-2 border p-3 bg-[#0A0A0A] transition-colors",
                                                            (isOutOfStock || isOverLimit) ? "border-red-500/50" : "border-[var(--color-border-main)]"
                                                        )}>
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex flex-col">
                                                                    <h4 className="font-mono-spec text-xs text-[var(--color-accent-brand)] mb-1">{item.model}</h4>
                                                                    {isOutOfStock && (
                                                                        <span className="text-[10px] font-bold text-red-500 font-mono-spec animate-pulse">OUT OF STOCK ERROR</span>
                                                                    )}
                                                                    {isOverLimit && (
                                                                        <span className="text-[10px] font-bold text-amber-500 font-mono-spec animate-pulse">STOCK LIMIT REACHED: MAX {item.stock}</span>
                                                                    )}
                                                                </div>
                                                                <button onClick={() => removeItem(item.id)} className="text-[var(--color-accent-prototype)] hover:text-[var(--color-foreground)] transition-colors">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center border border-[var(--color-border-main)]">
                                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"><Minus size={10} /></button>
                                                                    <span className="w-6 text-center font-mono-spec text-xs">{item.quantity}</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            const limit = item.stock || 9999;
                                                                            if (item.quantity < limit) updateQuantity(item.id, item.quantity + 1);
                                                                        }}
                                                                        className={cn("px-2 py-1 hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors", (item.quantity >= (item.stock || 9999)) && "opacity-20 cursor-not-allowed")}
                                                                    >
                                                                        <Plus size={10} />
                                                                    </button>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    {(() => {
                                                                        // Calculate Item Discount (Same logic as store/total)
                                                                        let discount = 0;
                                                                        const q = item.quantity;
                                                                        if (q >= 100) discount = 0.20;
                                                                        else if (q >= 50) discount = 0.15;
                                                                        else if (q >= 10) discount = 0.10;
                                                                        else if (q >= 2) discount = 0.05;

                                                                        const finalPrice = item.price * (1 - discount);

                                                                        return (
                                                                            <>
                                                                                <p className="text-xs text-[var(--color-foreground)] font-mono-spec font-bold">£{(finalPrice * item.quantity).toFixed(2)}</p>
                                                                                <div className="flex gap-2">
                                                                                    {discount > 0 && (
                                                                                        <span className="text-[10px] text-[var(--color-accent-brand)] font-mono-spec">
                                                                                            -{discount * 100}%
                                                                                        </span>
                                                                                    )}
                                                                                    <p className="text-[10px] text-[var(--color-foreground)] font-mono-spec opacity-50">
                                                                                        {discount > 0 ? (
                                                                                            <>
                                                                                                <span className="line-through mr-1 opacity-50">£{item.price.toFixed(2)}</span>
                                                                                                <span>£{finalPrice.toFixed(2)}</span>
                                                                                            </>
                                                                                        ) : (
                                                                                            `£${item.price.toFixed(2)} / ea`
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div className="border-t border-[var(--color-border-main)] p-3 bg-[#0A0A0A] space-y-2">
                                            {volumeSavings > 0 && (
                                                <div className="flex justify-between font-mono-spec text-[10px] text-[var(--color-accent-brand)]">
                                                    <span>VOLUME SAVINGS</span>
                                                    <span>-£{volumeSavings.toFixed(2)}</span>
                                                </div>
                                            )}

                                            {/* VOUCHER INPUT */}
                                            <div className="flex gap-2 mb-1 pt-1 border-t border-[var(--color-border-main)]">
                                                <input
                                                    type="text"
                                                    placeholder="PROMO CODE"
                                                    value={voucherCode}
                                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                                    className="flex-1 bg-transparent border border-[var(--color-border-main)] p-1.5 text-xs font-mono-spec uppercase focus:border-[var(--color-foreground)] outline-none ring-0 text-[var(--color-foreground)]"
                                                    disabled={!!appliedVoucher}
                                                />
                                                {appliedVoucher ? (
                                                    <button onClick={() => { setAppliedVoucher(null); setVoucherCode(""); }} className="bg-red-500 text-white px-2 py-1 text-[10px] font-bold font-mono-spec">REMOVE</button>
                                                ) : (
                                                    <button onClick={handleApplyVoucher} className="bg-[var(--color-foreground)] text-[var(--color-background)] px-2 py-1 text-[10px] font-bold uppercase hover:opacity-80 font-mono-spec">APPLY</button>
                                                )}
                                            </div>
                                            {voucherError && (
                                                <p className="text-[10px] text-red-500 font-mono-spec -mt-1 mb-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                                    <span className="bg-red-500 text-white px-1 mr-1">ERROR</span> {voucherError}
                                                </p>
                                            )}
                                            {appliedVoucher && (
                                                <div className="flex justify-between font-mono-spec text-[10px] text-[var(--color-accent-brand)]">
                                                    <span>VOUCHER ({appliedVoucher.code})</span>
                                                    <span>
                                                        {appliedVoucher.is_free_shipping && "FREE SHIP "}
                                                        {voucherDiscount > 0 && `(-£${voucherDiscount.toFixed(2)})`}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between font-mono-spec text-lg mb-2 text-[var(--color-foreground)] border-t border-[var(--color-border-main)] pt-2">
                                                <span>EST. TOTAL</span>
                                                <span>£{(cartTotal - voucherDiscount + (appliedVoucher?.is_free_shipping ? 0 : 0)).toFixed(2)}</span>
                                            </div>
                                            <button
                                                onClick={() => setView('SHIPPING')}
                                                disabled={items.length === 0 || hasStockViolation}
                                                className="w-full bg-[var(--color-foreground)] text-[var(--color-background)] font-bold py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
                                            >
                                                {hasStockViolation ? "STOCK VIOLATION DETECTED" : "PROCEED TO SHIPPING"} {items.length > 0 && !hasStockViolation && <ArrowRight size={14} />}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    /* SHIPPING VIEW */
                                    <div className="flex-1 flex flex-col h-full">
                                        <div className="p-3 border-b border-[var(--color-border-main)] bg-[#0A0A0A] flex items-center gap-2">
                                            <button onClick={() => setView('CART')} className="text-[10px] font-mono-spec text-[var(--color-foreground)] hover:opacity-70 flex items-center gap-1">
                                                <ChevronLeft size={12} /> BACK
                                            </button>
                                            <span className="text-[10px] font-bold uppercase mx-auto tracking-wider text-[var(--color-accent-brand)]">SHIPPING DETAILS</span>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="col-span-2 space-y-1">
                                                        <label className="text-[10px] font-mono-spec opacity-50 uppercase">Email Address</label>
                                                        <div className="relative">
                                                            <User size={12} className="absolute left-3 top-2.5 opacity-50" />
                                                            <input
                                                                type="email"
                                                                value={session ? session.user.email : shipping.email}
                                                                placeholder="procurement@company.com"
                                                                disabled={!!session}
                                                                onChange={e => updateShipping('email', e.target.value)}
                                                                className="w-full bg-[var(--color-background)] border border-[var(--color-border-main)] p-2 pl-8 font-mono-spec text-xs focus:outline-none focus:border-[var(--color-accent-brand)] placeholder:opacity-30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-span-1 space-y-1">
                                                        <label className="text-[10px] font-mono-spec opacity-50 uppercase">First Name</label>
                                                        <input
                                                            type="text"
                                                            value={shipping.name.split(' ')[0] || ''}
                                                            onChange={e => updateShipping('name', `${e.target.value} ${shipping.name.split(' ')[1] || ''}`.trim())}
                                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border-main)] p-2 font-mono-spec text-xs focus:outline-none focus:border-[var(--color-accent-brand)]"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 space-y-1">
                                                        <label className="text-[10px] font-mono-spec opacity-50 uppercase">Last Name</label>
                                                        <input
                                                            type="text"
                                                            value={shipping.name.split(' ')[1] || ''}
                                                            onChange={e => updateShipping('name', `${shipping.name.split(' ')[0] || ''} ${e.target.value}`.trim())}
                                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border-main)] p-2 font-mono-spec text-xs focus:outline-none focus:border-[var(--color-accent-brand)]"
                                                        />
                                                    </div>

                                                    <div className="col-span-2 space-y-1">
                                                        <label className="text-[10px] font-mono-spec opacity-50 uppercase">Address Line 1</label>
                                                        <input
                                                            type="text"
                                                            value={shipping.line1}
                                                            onChange={e => updateShipping('line1', e.target.value)}
                                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border-main)] p-2 font-mono-spec text-xs focus:outline-none focus:border-[var(--color-accent-brand)]"
                                                        />
                                                    </div>

                                                    <div className="col-span-1 space-y-1">
                                                        <label className="text-[10px] font-mono-spec opacity-50 uppercase">City</label>
                                                        <input
                                                            type="text"
                                                            value={shipping.city}
                                                            onChange={e => updateShipping('city', e.target.value)}
                                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border-main)] p-2 font-mono-spec text-xs focus:outline-none focus:border-[var(--color-accent-brand)]"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 space-y-1">
                                                        <label className="text-[10px] font-mono-spec opacity-50 uppercase">Postal Code</label>
                                                        <input
                                                            type="text"
                                                            value={shipping.postal_code}
                                                            onChange={e => updateShipping('postal_code', e.target.value)}
                                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border-main)] p-2 font-mono-spec text-xs focus:outline-none focus:border-[var(--color-accent-brand)]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="border border-[var(--color-border-main)] p-2 text-[10px] font-mono-spec opacity-50 cursor-not-allowed flex justify-between text-[var(--color-foreground)]">
                                                <span>United Kingdom</span>
                                                <span className="font-bold">GB</span>
                                            </div>
                                        </div>

                                        <div className="border-t border-[var(--color-border-main)] p-4 bg-[#0A0A0A] space-y-2">
                                            <div className="flex justify-between font-mono-spec text-[10px] opacity-70 text-[var(--color-foreground)]">
                                                <span>SUBTOTAL</span>
                                                <span>£{cartTotal.toFixed(2)}</span>
                                            </div>
                                            {appliedVoucher && (
                                                <div className="flex justify-between font-mono-spec text-[10px] text-[var(--color-accent-brand)]">
                                                    <span>VOUCHER ({appliedVoucher.code})</span>
                                                    <span>-£{voucherDiscount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-mono-spec text-[10px] text-[var(--color-foreground)]">
                                                <span>SHIPPING (DPD NEXT DAY)</span>
                                                <span>{shippingCost === 0 ? "FREE" : `£${shippingCost.toFixed(2)}`}</span>
                                            </div>

                                            <div className="flex justify-between font-mono-spec text-lg mb-2 text-[var(--color-foreground)] border-t border-[var(--color-border-main)] pt-2">
                                                <span>FINAL TOTAL</span>
                                                <span>£{finalTotal.toFixed(2)}</span>
                                            </div>

                                            {/* Safety Checkbox / Action Area - COMPACTED */}
                                            <div className="mt-2">
                                                {!isSafetyAccepted ? (
                                                    <div
                                                        className="bg-amber-500/10 border border-amber-500/20 p-2 cursor-pointer hover:bg-amber-500/20 transition-colors group flex items-start gap-3"
                                                        onClick={() => setIsSafetyAccepted(true)}
                                                    >
                                                        <div className="w-4 h-4 border-2 border-amber-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-amber-500 text-[10px] uppercase mb-0.5">Safety Check Required</h4>
                                                            <p className="text-[9px] text-[var(--color-foreground)] opacity-80 leading-tight font-mono-spec">
                                                                I confirm I am a professional user and accept dangerous goods handling terms.
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                        <button
                                                            onClick={() => setIsSafetyAccepted(false)}
                                                            className="w-10 bg-amber-500/10 border border-amber-500/50 flex flex-col items-center justify-center text-amber-500 hover:bg-amber-500/20 transition-colors rounded-sm"
                                                            title="Safety Accepted"
                                                        >
                                                            <Check size={16} />
                                                        </button>

                                                        <button
                                                            onClick={handleCheckout}
                                                            disabled={isLoading || hasStockViolation || !shipping.name || !shipping.line1 || !shipping.postal_code || (!session && !shipping.email)}
                                                            className="flex-1 bg-[var(--color-accent-energy)] text-[var(--color-background)] font-bold py-3 hover:bg-[var(--color-foreground)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
                                                        >
                                                            {isLoading ? "PROCESSING..." : hasStockViolation ? "STOCK ERROR" : "AUTHORIZE PAYMENT"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-center opacity-40 font-mono-spec text-[var(--color-foreground)]">SECURE CHECKOUT VIA STRIPE</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {/* ... ACCOUNT tab unchanged ... */}
                        {activeTab === 'account' && (
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* ... content ... */}
                                {!session ? (
                                    <div className="flex flex-col h-full items-center justify-center text-center space-y-6">
                                        <User size={48} className="text-[var(--color-foreground)] opacity-50" />
                                        <div className="space-y-2 text-[var(--color-foreground)]">
                                            <h3 className="font-bold tracking-tight">IDENTIFY</h3>
                                            <p className="text-xs font-mono-spec opacity-60">ACCESS ORDER HISTORY</p>
                                        </div>

                                        {!magicLinkSent ? (
                                            <div className="w-full space-y-4">
                                                {/* SOCIAL */}
                                                <div className="space-y-2">
                                                    <button onClick={() => handleSocialLogin('google')} className="bg-[#EA4335] text-white font-bold py-3 text-xs uppercase hover:opacity-90 flex items-center justify-center gap-2">
                                                        <span className="font-mono-spec">GOOGLE</span>
                                                    </button>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button onClick={() => handleSocialLogin('apple')} className="bg-white text-black font-bold py-3 text-xs uppercase hover:opacity-90 flex items-center justify-center gap-2">
                                                            <span className="font-mono-spec">APPLE</span>
                                                        </button>

                                                    </div>
                                                </div>

                                                <div className="relative py-2">
                                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-border-main)] opacity-30"></div></div>
                                                    <div className="relative flex justify-center"><span className="bg-[var(--color-background)] px-2 text-[10px] uppercase opacity-50 font-mono-spec text-[var(--color-foreground)]">OR EMAIL</span></div>
                                                </div>

                                                <form onSubmit={handleLogin} className="w-full space-y-4">
                                                    <input
                                                        type="email"
                                                        placeholder="EMAIL ADDRESS"
                                                        value={loginEmail}
                                                        onChange={e => setLoginEmail(e.target.value)}
                                                        className="w-full bg-transparent border border-[var(--color-border-main)] p-3 text-center font-mono-spec text-xs focus:outline-none focus:border-[var(--color-foreground)] text-[var(--color-foreground)]"
                                                        required
                                                    />
                                                    <button type="submit" className="w-full bg-transparent border border-[var(--color-foreground)] text-[var(--color-foreground)] font-bold py-3 text-xs uppercase hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors">
                                                        SEND MAGIC LINK
                                                    </button>
                                                </form>
                                            </div>
                                        ) : (
                                            <div className="bg-[var(--color-accent-brand)]/10 border border-[var(--color-accent-brand)] p-4 text-center">
                                                <p className="text-[var(--color-accent-brand)] font-mono-spec text-xs mb-1">LINK SENT</p>
                                                <p className="text-[10px] opacity-60 text-[var(--color-foreground)]">CHECK INBOX TO VERIFY</p>
                                                <button onClick={() => setMagicLinkSent(false)} className="mt-4 text-[10px] underline text-[var(--color-foreground)] hover:text-[var(--color-accent-brand)]">TRY AGAIN</button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end border-b border-[var(--color-border-main)] pb-4 text-[var(--color-foreground)]">
                                            <div>
                                                <div className="text-[10px] font-mono-spec opacity-50 mb-1">OPERATOR</div>
                                                <div className="text-sm font-bold">{session.user.email}</div>
                                                {isAdminUser && (
                                                    <a href="/admin" className="block mt-2 text-[10px] font-bold bg-amber-500 text-black px-2 py-1 w-fit hover:bg-white transition-colors">
                                                        ADMIN CONTROL
                                                    </a>
                                                )}
                                            </div>
                                            <button onClick={handleLogout} className="text-[10px] font-mono-spec hover:text-[var(--color-accent-power)] uppercase">LOGOUT</button>
                                        </div>

                                        <h3 className="font-mono-spec text-xs font-bold uppercase tracking-wider text-[var(--color-accent-prototype)] mb-4 flex items-center gap-2">
                                            <Package size={14} /> ORDER HISTORY
                                        </h3>

                                        {orders.length === 0 ? (
                                            <div className="text-center py-12 opacity-50 font-mono-spec text-xs text-[var(--color-foreground)]">NO RECORDS FOUND</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {orders.map(order => (
                                                    <div key={order.id} className="border border-[var(--color-border-main)] p-4 bg-[#0A0A0A] hover:border-[var(--color-foreground)] transition-colors">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="font-mono-spec text-xs text-[var(--color-accent-brand)]">{new Date(order.created_at).toLocaleDateString()}</span>
                                                            <span className="font-mono-spec text-[10px] opacity-50 text-[var(--color-foreground)]">#{order.id.slice(0, 6)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-[10px] font-bold bg-[var(--color-foreground)] text-[var(--color-background)] px-1.5 py-0.5">{order.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </>
    );
};

