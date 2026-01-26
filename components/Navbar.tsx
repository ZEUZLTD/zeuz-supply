"use client";

import { useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";


export const Navbar = () => {
    const { items, toggleCart, openAccount } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const isVisibleRef = useRef(false);

    useEffect(() => {
        setMounted(true);
        let hideTimer: ReturnType<typeof setTimeout> | null = null;

        const handleScroll = () => {
            if (window.scrollY > 100) {
                if (hideTimer) {
                    clearTimeout(hideTimer);
                    hideTimer = null;
                }
                if (!isVisibleRef.current) {
                    isVisibleRef.current = true;
                    setIsVisible(true);
                }
            } else {
                // Back at top. If visible, wait before hiding.
                if (isVisibleRef.current) {
                    if (hideTimer) clearTimeout(hideTimer);
                    hideTimer = setTimeout(() => {
                        isVisibleRef.current = false;
                        setIsVisible(false);
                    }, 2500);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        // Initial check
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (hideTimer) clearTimeout(hideTimer);
        };
    }, []);

    const count = items.reduce((acc, item) => acc + item.quantity, 0);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        setShowMenu(false);
    };

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-40 p-4 md:p-6 pointer-events-none mix-blend-difference text-white transition-all duration-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        )}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-8 pointer-events-auto relative">
                    <div className="relative group">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="font-bold text-3xl md:text-2xl tracking-tighter hover:opacity-70 transition-opacity flex items-center gap-2 pointer-events-auto relative z-50"
                        >
                            ZEUZ_SUPPLY <span className={`text-[10px] opacity-50 transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        <div className={`absolute top-full left-0 pt-4 bg-transparent transition-all duration-300 ${showMenu ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                            <div className="bg-white text-black border border-black p-2 min-w-[200px] shadow-xl mix-blend-normal">
                                <button onClick={() => scrollTo('POWER')} className="block w-full text-left px-4 py-3 font-mono-spec text-sm hover:bg-black hover:text-white uppercase transition-colors border-b border-black/5">POWER SERIES</button>
                                <button onClick={() => scrollTo('ENERGY')} className="block w-full text-left px-4 py-3 font-mono-spec text-sm hover:bg-black hover:text-white uppercase transition-colors border-b border-black/5">ENERGY SERIES</button>
                                <button onClick={() => scrollTo('PROTOTYPE')} className="block w-full text-left px-4 py-3 font-mono-spec text-sm hover:bg-black hover:text-white uppercase transition-colors border-b border-black/5">PROTOTYPE</button>
                                <div className="h-px bg-black/10 my-1" />
                                <button onClick={() => scrollTo('footer')} className="block w-full text-left px-4 py-3 font-mono-spec text-sm hover:bg-black hover:text-white uppercase transition-colors">CONTACT / LEGAL</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Manifest + Identity (Swapped Order) */}
                <div className="flex items-center gap-6 pointer-events-auto">
                    <button
                        onClick={toggleCart}
                        className="group flex items-center gap-2 font-mono-spec text-sm font-bold uppercase tracking-wide hover:opacity-70 transition-opacity"
                    >
                        <span>MANIFEST</span>
                        <span className="bg-[var(--color-accent-brand)] text-[var(--color-background)] px-1.5 py-0.5 text-xs">
                            {mounted ? count : 0}
                        </span>
                    </button>

                    <button onClick={openAccount} className="font-mono-spec text-sm font-bold uppercase tracking-wide hover:opacity-70 transition-opacity">
                        IDENTITY
                    </button>
                </div>
            </div>
        </header >
    );
};
