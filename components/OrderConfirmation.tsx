"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore, useUIStore } from "@/lib/store";
import { Check, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const OrderConfirmation = () => {
    const searchParams = useSearchParams();
    const clearCart = useCartStore(state => state.clearCart);
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState("");
    const [orderId, setOrderId] = useState("");

    useEffect(() => {
        const success = searchParams.get('success');
        const sessionId = searchParams.get('session_id');

        if (success === 'true' && sessionId) {
            setStatus('PROCESSING');

            // Call confirmation API
            fetch(`/api/confirm-order?session_id=${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success || data.alreadyExists) {
                        setStatus('SUCCESS');
                        setOrderId((data.order as unknown as { id: string })?.id || data.orderId);
                        clearCart();
                        // Trigger immediate refresh of order history
                        useUIStore.getState().triggerOrderRefresh();

                        // Clean URL without refresh
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, '', newUrl);
                    } else if (data.refunded) {
                        setStatus('ERROR');
                        setMessage("Order refunded due to stock unavailability.");
                    } else {
                        setStatus('ERROR');
                        setMessage(data.error || "Order verification failed.");
                    }
                })
                .catch(err => {
                    console.error(err);
                    setStatus('ERROR');
                    setMessage("Network error verifying order.");
                });
        }
    }, [searchParams, clearCart]);

    const closeOverlay = () => {
        setStatus('IDLE');
        // Ensure URL is clean if user closes manually without success
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    };

    if (status === 'IDLE') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
                <div className="bg-[var(--color-background)] border border-[var(--color-border-main)] max-w-md w-full p-8 shadow-2xl relative">
                    <button
                        onClick={closeOverlay}
                        className="absolute top-4 right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-4">
                        {status === 'PROCESSING' && (
                            <>
                                <Loader2 className="w-12 h-12 animate-spin text-[var(--color-accent-brand)]" />
                                <h2 className="text-xl font-bold font-mono-spec">VERIFYING ORDER_</h2>
                                <p className="text-sm opacity-60">Synchronizing with payment processor...</p>
                            </>
                        )}

                        {status === 'SUCCESS' && (
                            <>
                                <div className="w-16 h-16 bg-[var(--color-accent-energy)] rounded-full flex items-center justify-center text-black mb-2">
                                    <Check className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold font-mono-spec text-[var(--color-accent-energy)]">ORDER CONFIRMED</h2>
                                <p className="text-sm opacity-80">
                                    Thank you for your purchase. Your order has been secured.
                                </p>
                                {orderId && (
                                    <div className="bg-zinc-100 dark:bg-zinc-900 p-3 w-full font-mono text-xs break-all border border-dashed border-zinc-300 dark:border-zinc-700 mt-2">
                                        REF: {orderId}
                                    </div>
                                )}
                                <p className="text-xs opacity-50 mt-4">
                                    A confirmation email has been sent to your inbox.
                                </p>
                                <button
                                    onClick={closeOverlay}
                                    className="mt-6 px-8 py-3 bg-[var(--color-foreground)] text-[var(--color-background)] font-bold uppercase text-sm hover:bg-[var(--color-accent-brand)] w-full transition-colors"
                                >
                                    Continue Shopping
                                </button>
                            </>
                        )}

                        {status === 'ERROR' && (
                            <>
                                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white mb-2">
                                    <X className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-bold font-mono-spec text-red-500">ORDER ISSUE</h2>
                                <p className="text-sm opacity-80">{message}</p>
                                <p className="text-xs opacity-50 mt-4">
                                    If you were charged, please contact support with your Stripe Session ID.
                                </p>
                                <div className="w-full bg-red-50 dark:bg-red-900/20 p-2 mt-2 text-xs font-mono break-all">
                                    ID: {searchParams.get('session_id')}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
