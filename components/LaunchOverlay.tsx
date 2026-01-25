"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const LaunchOverlay = ({ enabled = true, title, subtitle }: { enabled?: boolean, title?: string, subtitle?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

    useEffect(() => {
        // Preview Mode Override
        const isPreview = typeof window !== 'undefined' && window.location.search.includes('launch_promo=true');

        if (!enabled && !isPreview) return;

        // Check if seen
        const seen = localStorage.getItem('zeuz_launch_seen');
        if ((!seen || isPreview) && (enabled || isPreview)) {
            // Small delay for dramatic effect
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [enabled]);

    // Don't return null immediately if enabled is false, because we might open via effect later (if preview).
    // Actually, simpler logic: 
    // If not enabled and not preview, return null. But we don't know preview until mount.
    // So render nothing until open.

    // Correction: The hook handles the opening. If we return null here, it never renders. 
    // But we need to allow rendering to support the effect running.
    // Actually, just relying on `isOpen` state being false initially is enough. 

    // Wait, if I returned null before, the Effect wouldn't run? 
    // Yes, if I conditionally return before the hook, that's a React violation.
    // But I was returning null at the END of the component logic in previous steps? 
    // The previous code had `if (!enabled) return null;` AFTER the effect. That was fine.

    // New logic:
    // We only return null if !isOpen.
    // But we need to check enabled prop to decide if we run the open logic.

    // Let's stick to the structure:
    // Effect determines if we open.
    // If open, we render.

    // Defaults
    const displayTitle = title || "£1.00 CELL<br />DROP";
    const displaySubtitle = subtitle || "First 100 industrial accounts to register get allocation of 21700 prototype cells at £1.00 each.";

    const handleDismiss = () => {
        setIsOpen(false);
        localStorage.setItem('zeuz_launch_seen', 'true');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('LOADING');

        const { error } = await supabase.from('signups').insert({
            email,
            product_id: 'launch_promo_pound_cell'
        });

        if (error) {
            console.error(error);
            setStatus('ERROR');
        } else {
            setStatus('SUCCESS');
            // Auto close after success? Or just show success state.
            // Let's keep it open so they see the success message.
            setTimeout(() => {
                handleDismiss();
            }, 3000);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[var(--color-background)] border border-[var(--color-accent-power)] w-full max-w-lg relative overflow-hidden shadow-2xl"
                    >
                        {/* Dramatic Header */}
                        <div className="bg-[var(--color-accent-power)] p-1 flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-white px-2 tracking-widest">System Alert // PROMO_SEQ_01</span>
                            <button onClick={handleDismiss} className="text-white hover:bg-white/20 p-1">
                                <X size={14} />
                            </button>
                        </div>

                        <div className="p-8 md:p-12 text-center">
                            <div className="inline-block border border-[var(--color-accent-power)] text-[var(--color-accent-power)] px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
                                Limited Allocation
                            </div>

                            <h2
                                className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4 leading-none"
                                dangerouslySetInnerHTML={{ __html: displayTitle }}
                            />

                            <p className="font-mono-spec text-sm opacity-70 mb-8 max-w-xs mx-auto leading-relaxed">
                                {displaySubtitle}
                            </p>

                            {status === 'SUCCESS' ? (
                                <div className="bg-[var(--color-accent-energy)] p-4 text-[var(--color-background)] font-bold font-mono-spec text-center border2 border-[var(--color-foreground)]">
                                    <div className="text-xl mb-1">REGISTRATION CONFIRMED</div>
                                    <div className="text-xs opacity-80 uppercase">Check your inbox for manifest ID</div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                    <input
                                        type="email"
                                        required
                                        placeholder="ENTER INDUSTRIAL EMAIL"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-transparent border border-[var(--color-border-main)] p-4 text-center font-mono-spec text-sm focus:outline-none focus:border-[var(--color-accent-power)] uppercase"
                                    />
                                    <button
                                        disabled={status === 'LOADING'}
                                        className="w-full bg-[var(--color-accent-power)] text-[var(--color-background)] p-4 font-bold uppercase tracking-widest hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors disabled:opacity-50"
                                    >
                                        {status === 'LOADING' ? 'PROCESSING...' : 'CLAIM ALLOCATION'}
                                    </button>
                                </form>
                            )}

                            <div className="mt-8 text-[10px] font-mono-spec opacity-40 uppercase">
                                *Limit 1 sample unit per verified business entity.
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
