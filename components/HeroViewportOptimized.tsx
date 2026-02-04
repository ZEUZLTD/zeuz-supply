"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HeroViewport } from "./HeroViewport";

export const HeroViewportOptimized = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Smart Deferral: Wait for Main Thread to be idle (TBT Optimization)
        // Fallback to 2500ms if browser is busy (Ensures LCP isn't delayed forever)
        if ('requestIdleCallback' in window) {
            const handle = window.requestIdleCallback(() => {
                setMounted(true);
            }, { timeout: 2500 });
            return () => window.cancelIdleCallback(handle);
        } else {
            // Fallback for Safari/Older browsers
            const timer = setTimeout(() => setMounted(true), 2500);
            return () => clearTimeout(timer);
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
