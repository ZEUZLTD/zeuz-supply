'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface SplashScreenProps {
    enabled: boolean;
    message?: string;
}

export function SplashScreen({ enabled, message = "SYSTEM INITIALIZING..." }: SplashScreenProps) {
    const searchParams = useSearchParams();
    const isPreview = searchParams.get('splash') === 'true';
    const [isVisible, setIsVisible] = useState(enabled || isPreview);

    useEffect(() => {
        if (!enabled && !isPreview) return;

        // check session storage to only show once per session (unless preview)
        const hasSeen = sessionStorage.getItem('zeuz_splash_seen');
        if (hasSeen && !isPreview) {
            setIsVisible(false);
            return;
        }

        const timer = setTimeout(() => {
            setIsVisible(false);
            if (!isPreview) sessionStorage.setItem('zeuz_splash_seen', 'true');
        }, 3500); // 3.5s duration

        return () => clearTimeout(timer);
    }, [enabled, isPreview]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
                    className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center font-mono-spec"
                >
                    <div className="overflow-hidden">
                        <motion.h1
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
                            className="text-6xl md:text-9xl font-black tracking-tighter"
                        >
                            ZEUZ
                        </motion.h1>
                    </div>

                    <div className="overflow-hidden mt-2">
                        <motion.div
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.4 }}
                            className="text-sm md:text-base text-gray-400 flex items-center gap-2"
                        >
                            <span className="w-2 h-2 bg-green-500 animate-pulse rounded-full" />
                            {message || "SUPPLY CHAIN VERIFIED"}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
