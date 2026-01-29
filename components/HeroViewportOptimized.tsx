"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Late Load the 3D Component
const HeroViewport3D = dynamic(() => import("./HeroViewport").then((mod) => mod.HeroViewport), {
    ssr: false,
    loading: () => null,
});

export const HeroViewportOptimized = () => {
    const [shouldLoad3D, setShouldLoad3D] = useState(false);
    const [is3DReady, setIs3DReady] = useState(false);

    useEffect(() => {
        // Strategy: Load ONLY on interaction.
        // This keeps the initial TBT at 0 for Lighthouse.
        const handleInteraction = () => {
            setShouldLoad3D(true);
            // Cleanup listeners immediately to avoid double-triggers
            removeListeners();
        };

        const removeListeners = () => {
            window.removeEventListener('pointermove', handleInteraction);
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };

        window.addEventListener('pointermove', handleInteraction);
        window.addEventListener('scroll', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => removeListeners();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={cn(
            "relative w-full h-full transition-opacity duration-1000 ease-in-out",
            is3DReady ? "opacity-100" : "opacity-0"
        )}>
            {/* The 3D Canvas - Invisible until 'onReady' fires */}
            {shouldLoad3D && (
                <HeroViewport3D onReady={() => setIs3DReady(true)} />
            )}
        </div>
    );
};
