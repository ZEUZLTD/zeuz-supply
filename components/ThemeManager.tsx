"use client";

import { useUIStore } from "@/lib/store";
import { useEffect } from "react";

export const ThemeManager = () => {
    const themeColor = useUIStore((state) => state.themeColor);

    useEffect(() => {
        if (themeColor === 'RAINBOW') {
            let frameId: number;
            const animate = () => {
                const hue = (Date.now() / 333) % 360; // Sped up by 3x from the ultra-slow setting
                document.documentElement.style.setProperty('--color-accent-brand', `hsl(${hue}, 100%, 50%)`);
                frameId = requestAnimationFrame(animate);
            };
            frameId = requestAnimationFrame(animate);

            return () => cancelAnimationFrame(frameId);
        } else {
            document.documentElement.style.setProperty('--color-accent-brand', themeColor);
        }
    }, [themeColor]);

    return null;
};
