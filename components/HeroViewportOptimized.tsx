"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HeroViewport } from "./HeroViewport";

export const HeroViewportOptimized = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className={cn(
            "relative w-full h-full transition-opacity duration-1000 ease-in-out opacity-100"
        )}>
            <HeroViewport onReady={() => { }} />
        </div>
    );
};
