"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Late Load the 3D Component
const HeroViewport3D = dynamic(() => import("./HeroViewport").then((mod) => mod.HeroViewport), {
    ssr: false,
    loading: () => null, // No loader, just transparent
});

export const HeroViewportOptimized = () => {
    const [shouldLoad3D, setShouldLoad3D] = useState(false);
    const [is3DReady, setIs3DReady] = useState(false);

    useEffect(() => {
        // Wait for main thread to settle heavily (2.5s)
        const loadTimer = setTimeout(() => {
            setShouldLoad3D(true);
        }, 2500);

        return () => clearTimeout(loadTimer);
    }, []);

    // NOTE: In a perfect world, HeroViewport would expose an 'onReady' prop.
    // For now, we'll assume that once the component MOUNTS, it takes another small moment to render.
    // We can add a small artificial delay after mount to fade.
    useEffect(() => {
        if (shouldLoad3D) {
            const readyTimer = setTimeout(() => {
                setIs3DReady(true);
            }, 1000); // Give 3D engine 1s to initialize before fading out poster
            return () => clearTimeout(readyTimer);
        }
    }, [shouldLoad3D]);

    return (
        <div className="relative w-full h-full">
            {/* Layer 1: The "Lie" (Screenshot) */}
            {/* This stays visible until 3D is 100% ready */}
            <div
                className={cn(
                    "absolute inset-0 z-10 transition-opacity duration-1000 ease-in-out bg-transparent flex items-center justify-center",
                    is3DReady ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
            >
                {/* 
                    TODO FOR USER: 
                    Replace '/images/products/sam-50s/1.png' with a perfect screenshot of your 3D canvas.
                    The screenshot should match the camera angle: position: [0, 0, 7], fov: 35
                */}
                <div className="relative w-[50vh] h-[50vh] animate-in fade-in zoom-in duration-1000">
                    <Image
                        src="/images/products/sam-50s/1.png"
                        alt="Hero Cell Placeholder"
                        fill
                        className="object-contain drop-shadow-2xl"
                        priority
                    />
                </div>
            </div>

            {/* Layer 2: The "Truth" (3D Canvas) */}
            {shouldLoad3D && (
                <div className="absolute inset-0 z-0">
                    <HeroViewport3D />
                </div>
            )}
        </div>
    );
};
