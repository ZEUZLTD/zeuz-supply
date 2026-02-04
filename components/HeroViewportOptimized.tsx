"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HeroViewport } from "./HeroViewport";

export const HeroViewportOptimized = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Smart Deferral v3: Omni-Device Interaction Aware
        const isMobile = window.matchMedia("(max-width: 768px)").matches;

        const load = () => {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => setMounted(true), { timeout: 2000 });
            } else {
                setTimeout(() => setMounted(true), 500);
            }
        };

        const handleInteraction = () => {
            load();
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };

        // Listen for ANY user activity
        window.addEventListener('scroll', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });
        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('mousemove', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });

        // Final Fallback: Ensure it loads eventually even if user is staring
        const fallbackDelay = isMobile ? 6000 : 4500; // Desktop gets 3D slightly sooner
        const timer = setTimeout(load, fallbackDelay);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
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
