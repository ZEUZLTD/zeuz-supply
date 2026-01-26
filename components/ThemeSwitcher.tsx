"use client";

import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

const THEME_COLORS = [
    '#D946EF', // Neon Purple (Default)
    '#FF3300', // Power Red
    '#00FF99', // Energy Green
    '#FFC266', // Original Amber
    '#3B82F6', // Tech Blue
    '#EC4899', // Hot Pink
    'RAINBOW', // Special Gradient Mode
];

export const ThemeSwitcher = ({ session }: { session?: Session | null }) => {
    const { themeColor, setThemeColor } = useUIStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleThemeChange = async (color: string) => {
        setThemeColor(color);
        setIsOpen(false);

        if (session && session.user) {
            await supabase.from('profiles').upsert({
                id: session.user.id,
                theme_color: color,
                updated_at: new Date()
            });
        }
    };

    return (
        <div className="relative pointer-events-auto">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-4 h-4 bg-[var(--color-accent-brand)] hover:opacity-80 transition-opacity block"
                aria-label="Change Theme"
            />

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 p-2 bg-white border border-black flex gap-1 shadow-xl w-[max-content] z-50"
                    >
                        {THEME_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => handleThemeChange(color)}
                                className={cn(
                                    "w-6 h-6 hover:scale-110 transition-transform",
                                    themeColor === color && "ring-2 ring-black"
                                )}
                                style={{
                                    background: color === 'RAINBOW'
                                        ? 'linear-gradient(to bottom right, red, orange, yellow, green, blue, indigo, violet)'
                                        : color
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
