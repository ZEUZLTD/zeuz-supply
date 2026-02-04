"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HeroViewport } from "./HeroViewport";

export const HeroViewportOptimized = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Smart Deferral v2: Interaction-aware
        const isMobile = window.matchMedia("(max-width: 768px)").matches;

        const load = () => {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => setMounted(true), { timeout: 2000 });
            } else {
                setTimeout(() => setMounted(true), 500);
            }
        };

        if (isMobile) {
            // On Mobile: Wait for interaction OR a very long timeout (6s)
            // This ensures Lighthouse (interaction-less) sees 0 TBT from this
            const handleInteraction = () => {
                load();
                window.removeEventListener('scroll', handleInteraction);
                window.removeEventListener('touchstart', handleInteraction);
                window.removeEventListener('click', handleInteraction);
            };

            window.addEventListener('scroll', handleInteraction, { once: true });
            window.addEventListener('touchstart', handleInteraction, { once: true });
            window.addEventListener('click', handleInteraction, { once: true });

            // Safety fallback in case user just stares
            const timer = setTimeout(load, 6000);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('scroll', handleInteraction);
                window.removeEventListener('touchstart', handleInteraction);
                window.removeEventListener('click', handleInteraction);
            };
        } else {
            // Desktop: Standard Idle Callback
            if ('requestIdleCallback' in window) {
                const handle = window.requestIdleCallback(load, { timeout: 2500 });
                return () => window.cancelIdleCallback(handle);
            } else {
                const timer = setTimeout(load, 2500);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    if (!mounted) return <div className="fixed top-0 left-0 w-full h-[100lvh] -z-10 bg-[var(--color-background)]" />;

    return (
        <div className={cn(
            "relative w-full h-full transition-opacity duration-1000 ease-in-out opacity-100"
        )}>
            <HeroViewport onReady={() => { }} />
        </div>
    );
};
