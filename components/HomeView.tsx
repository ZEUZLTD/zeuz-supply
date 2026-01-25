"use client";

import { CellCard } from "@/components/CellCard";
import { SectionType, useUIStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';

const HeroViewport = dynamic(() => import('@/components/HeroViewport').then(mod => mod.HeroViewport), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-transparent" /> // Invisible placeholder
});
import { useInView } from "framer-motion";
import { InventoryItem } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import { SectionInfo } from "@/components/SectionInfo";
import { Navbar } from "@/components/Navbar";
import { ProductDetailView } from "@/components/ProductDetailView";
import { LaunchOverlay } from "@/components/LaunchOverlay";

const Section = ({ title, type, items }: { title: string, type: SectionType, items: InventoryItem[] }) => {
    const ref = useRef(null);
    // Use narrower margin to ensure section is well into viewport before triggering
    const isInView = useInView(ref, { margin: "-45% 0px -45% 0px" });
    const { setActiveSection } = useUIStore();

    useEffect(() => {
        if (isInView) setActiveSection(type);
    }, [isInView, type, setActiveSection]);

    if (items.length === 0) return null;

    // Theme Logic
    const themeColor = type === 'POWER' ? 'text-[var(--color-accent-power)]' :
        type === 'ENERGY' ? 'text-[var(--color-accent-energy)]' :
            'text-[var(--color-foreground)]';

    const borderColor = type === 'POWER' ? 'border-[var(--color-accent-power)]' :
        type === 'ENERGY' ? 'border-[var(--color-accent-energy)]' :
            'border-[var(--color-border-main)]';

    // REMOVED: bgGradient logic for cleaner look

    return (
        <section ref={ref} id={type} className="min-h-screen flex flex-col justify-end relative pt-32 md:pt-40">
            <div className={`px-4 mb-4 border-l-4 ${type === 'POWER' ? 'border-[var(--color-accent-power)]' : type === 'ENERGY' ? 'border-[var(--color-accent-energy)]' : 'border-[var(--color-foreground)]'} ml-4 md:ml-0`}>
                <h2 className={cn("text-[12vw] leading-[0.8] font-bold tracking-tighter mix-blend-difference opacity-90", themeColor)}>
                    {title}
                </h2>
                {/* Underline removed per request */}
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-[var(--color-background)] border border-[var(--color-border-main)] w-full", borderColor)}>
                {items.map(item => <CellCard key={item.id} item={item} />)}
            </div>
        </section>
    )
}

import { useLiveInventory } from "@/hooks/useLiveInventory";

// ... existing imports ...

export const HomeView = ({ inventory: initialInventory, settings = [] }: { inventory: InventoryItem[], settings?: any[] }) => {
    // Live Inventory Hook
    const inventory = useLiveInventory(initialInventory);

    const powerItems = inventory.filter(i => i.category === 'POWER');
    const energyItems = inventory.filter(i => i.category === 'ENERGY');
    const prototypeItems = inventory.filter(i => i.category === 'PROTOTYPE');

    // reset section on mount
    const { setActiveSection: setGlobalActiveSection } = useUIStore();
    useEffect(() => {
        window.scrollTo(0, 0);
        setGlobalActiveSection('HERO' as any); // Force default at start
    }, [setGlobalActiveSection]);

    // ... imports

    // Hero Trigger
    const heroSectionRef = useRef(null);
    const isHeroInView = useInView(heroSectionRef, { margin: "-10% 0px -10% 0px" });
    const { setActiveSection, activeSection } = useUIStore(); // Need activeSection for frosting

    useEffect(() => {
        if (isHeroInView) setActiveSection('HERO' as any);
    }, [isHeroInView, setActiveSection]);

    // Reliable Hero Reset on Scroll & Dynamic Frosting
    const [heroOpacity, setHeroOpacity] = useState(1);
    const [frostIntensity, setFrostIntensity] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            // Force HERO state if at very top
            if (scrollY < 50 && (activeSection as any) !== 'HERO') {
                setActiveSection('HERO' as any);
            }

            // Hero Text Opacity (Fade out)
            // Hero Text Opacity (Fade out)
            const newOpacity = Math.max(0, 1 - scrollY / 500);
            setHeroOpacity(newOpacity);

            // Frosting Intensity (Starts at 80vh, Full at 100vh) - Delayed start per request
            // 0 at 0.7 * vh, 1 at 1.0 * vh
            const startRatio = 0.7;
            const endRatio = 1.0;
            const startScroll = viewportHeight * startRatio;
            const endScroll = viewportHeight * endRatio;

            let frost = 0;
            if (scrollY > startScroll) {
                frost = Math.min(1, (scrollY - startScroll) / (endScroll - startScroll));
            }
            setFrostIntensity(frost);
        };
        window.addEventListener("scroll", handleScroll);
        // Initial check
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [activeSection, setActiveSection]);

    return (
        <main className="min-h-screen">
            {/* Launch Promo Overlay */}
            {/* Launch Promo Overlay */}
            <LaunchOverlay
                enabled={settings.find((s: any) => s.key === 'LAUNCH_DISCOUNT_ACTIVE')?.value ?? true}
                title={settings.find((s: any) => s.key === 'LAUNCH_TITLE')?.value}
                subtitle={settings.find((s: any) => s.key === 'LAUNCH_SUBTITLE')?.value}
            />

            {/* Product Details - Moved to Root for Z-Index Safety */}
            <ProductDetailView items={inventory} />

            {/* Viewport - Fixed Background (-10) */}
            <div className="fixed inset-0 -z-10 pointer-events-auto">
                <HeroViewport />
            </div>

            {/* DYNAMIC FROSTING LAYER - Reduced Max Intensity */}
            <div
                className="fixed inset-0 -z-0 pointer-events-none transition-all duration-75 ease-linear"
                style={{
                    backdropFilter: `blur(${frostIntensity * 5}px)`, // Reduced blur (Target 5px)
                    backgroundColor: `rgba(0, 0, 0, ${frostIntensity * 0.1})` // Reduced darkening (Target 10%)
                }}
            />

            {/* Intro Hero - Text & Trigger */}
            <div
                ref={heroSectionRef}
                className="fixed top-0 left-0 right-0 h-screen flex flex-col items-center justify-center pointer-events-none transition-opacity duration-100 ease-out z-0"
                style={{ opacity: heroOpacity }}
            >
                <h1 className="w-full max-w-[95vw] grid grid-cols-2 -translate-x-[2vw] text-[38vw] md:text-[25vw] font-bold text-zinc-800 leading-none">
                    {/* LEFT: Z E */}
                    <div className="flex justify-end items-center tracking-tighter">
                        <span>Z</span>
                        <span className="pr-[0.3vw]">E</span>
                    </div>

                    {/* RIGHT: U Z */}
                    <div className="flex justify-start items-center tracking-tighter">
                        <span className="pl-[0.3vw]">U</span>
                        <span>Z</span>
                    </div>
                </h1>
                <p className="text-xl md:text-2xl font-mono-spec tracking-[0.5em] text-zinc-500 font-bold mt-8">
                    INDUSTRIAL SUPPLY
                </p>
            </div>

            {/* Spacer to push content below fold */}
            <div className="h-[100vh] pointer-events-none" />

            {/* Content Sections */}
            <div className="relative z-10 w-full">
                <Section title="POWER" type="POWER" items={powerItems} />
                <SectionInfo type="POWER" products={powerItems} />

                <Section title="ENERGY" type="ENERGY" items={energyItems} />
                <SectionInfo type="ENERGY" products={energyItems} />

                <Section title="PROTOTYPE" type="PROTOTYPE" items={prototypeItems} />
            </div>

            {/* Footer */}
            <div className="relative z-20 bg-[var(--color-background)]">
                {/* Removed ProductDetailView from here */}
                <Footer />
            </div>
        </main>
    );
};

const Footer = () => {
    const [legalSection, setLegalSection] = useState<'TERMS' | 'PRIVACY' | 'SHIPPING' | null>(null);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

    // Unified Contact Context
    const { contactMode, contactContext, setContactMode, user } = useUIStore();

    // Reset fields when mode changes
    useEffect(() => {
        setStatus('IDLE');
        setMessage("");
        setEmail(user?.email || "");
        // Optional: Pre-fill message based on context?
        if (contactMode === 'BULK_QUOTE' && contactContext) {
            setMessage(`I am interested in ${contactContext.quantity} units of ${contactContext.productModel}.`);
        }
    }, [contactMode, contactContext, user]);

    const handleNewsletter = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('LOADING');

        // Map UI Mode to DB Enum
        // UI: 'NEWSLETTER' | 'STOCK_NOTIFY' | 'PROTO_WAITLIST' | 'BULK_QUOTE' | 'GENERAL'
        // DB: 'NEWSLETTER', 'STOCK_NOTIFY', 'PROTO_WAITLIST', 'BULK_QUOTE', 'GENERAL'
        // They match!

        // Use Server Action
        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('type', contactMode);
            formData.append('message', message);
            formData.append('metadata', JSON.stringify(contactContext || {}));

            const { submitInquiry } = await import('@/app/actions/inquiry');
            await submitInquiry(formData);

            setStatus('SUCCESS');
            setEmail("");
            setMessage("");
            // Reset to default Nl after 3s
            setTimeout(() => {
                setStatus('IDLE');
                setContactMode('NEWSLETTER');
            }, 3000);
        } catch (e) {
            console.error(e);
            setStatus('ERROR');
        }
    };

    const legalContent = {
        TERMS: "All orders are processed in USD/GBP. Industrial cells are sold for professional OEM/ODM use only. By purchasing, you agree that you are handling raw lithium cells with proper BMS protection and thermal management. ZEUZ SUPPLY is not liable for misuse.",
        PRIVACY: "We collect email addresses for order processing and notification purposes only. Your data is stored securely via Supabase. We do not sell data to third parties. Cookies are used strictly for session management.",
        SHIPPING: "Global shipping via DHL Dangerous Goods services. DDP (Delivered Duty Paid) available for EU/UK. Lead times: Stock (48h), Backorder (1-2 weeks). Hazardous material fees apply to all battery shipments."
    };

    // Configuration for Contact Header
    const getHeaderInfo = () => {
        switch (contactMode) {
            case 'STOCK_NOTIFY':
                return { title: `RESTOCK ALERT: ${contactContext?.productModel || 'ITEM'}`, subtitle: "We will email you immediately when stock arrives." };
            case 'PROTO_WAITLIST':
                return { title: `WAITLIST: ${contactContext?.productModel || 'PROTOTYPE'}`, subtitle: "Join the engineering queue for early access." };
            case 'BULK_QUOTE':
                return { title: `BULK REQUEST: ${contactContext?.quantity}x ${contactContext?.productModel}`, subtitle: "Direct volume pricing from the factory." };
            case 'GENERAL':
                return { title: "CONTACT ENGINEERING", subtitle: "Technical questions or partnership inquiries." };
            case 'NEWSLETTER':
            default:
                return { title: "SYSTEM UPDATES", subtitle: "Subscribe for restock notifications, prototype allocations, and technical datasheets." };
        }
    };

    const header = getHeaderInfo();
    const showTextArea = contactMode === 'BULK_QUOTE' || contactMode === 'GENERAL';

    return (
        <div className="relative z-20 bg-[var(--color-background)] border-t border-[var(--color-border-main)] py-24 px-8" id="footer">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 font-mono-spec text-sm mb-16">
                <div>
                    <h4 className="font-bold mb-4 text-[var(--color-accent-brand)]">ZEUZ SUPPLY</h4>
                    <p className="opacity-60 mb-4">High-performance lithium cells for industrial applications.</p>
                    <div className="flex gap-2 opacity-50">
                        {/* Mock WEEE Symbol / Compliance Icons */}
                        <div className="border border-current p-1 text-[10px] w-8 h-8 flex items-center justify-center rounded-full" title="WEEE Compliant">
                            <span className="block rotate-45 text-xs">🗑️</span>
                        </div>
                        <div className="border border-current p-1 text-[10px] w-8 h-8 flex items-center justify-center font-bold" title="Li-ion Recycle">
                            Li
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-4">LEGAL</h4>
                    <ul className="space-y-2 opacity-60">
                        <li>
                            <button onClick={() => setLegalSection(legalSection === 'TERMS' ? null : 'TERMS')} className="hover:text-[var(--color-accent-power)] uppercase text-left">
                                Terms of Service
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setLegalSection(legalSection === 'PRIVACY' ? null : 'PRIVACY')} className="hover:text-[var(--color-accent-power)] uppercase text-left">
                                Privacy Policy
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setLegalSection(legalSection === 'SHIPPING' ? null : 'SHIPPING')} className="hover:text-[var(--color-accent-power)] uppercase text-left">
                                Shipping Policy
                            </button>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4">COMPLIANCE</h4>
                    <ul className="space-y-2 opacity-60 text-xs">
                        <li>UN38.3 CERTIFIED</li>
                        <li>RoHS COMPLIANT</li>
                        <li>ISO 9001:2015 FAB</li>
                        <li className="pt-2 text-[10px] uppercase leading-tight">
                            Contains Li-Ion. <br />Recycle Responsibly.
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4">MANIFEST</h4>
                    <p className="opacity-60">
                        ZEUZ SUPPLY © 2026<br />
                        ALL RIGHTS RESERVED
                    </p>
                    <p className="opacity-40 text-[10px] mt-4 uppercase max-w-[200px]">
                        Industrial/OEM use only. Not for consumer vaping devices.
                    </p>
                </div>
            </div>

            {/* Newsletter / Contact Section */}
            <div className="max-w-7xl mx-auto border-t border-[var(--color-border-main)] pt-12" id="newsletter">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div>
                        <h4 className="font-bold mb-2 uppercase tracking-tight">
                            {header.title}
                        </h4>
                        <p className="font-mono-spec text-xs opacity-60 max-w-md">
                            {header.subtitle}
                        </p>
                    </div>
                    <div>
                        {status === 'SUCCESS' ? (
                            <div className="p-4 bg-[var(--color-accent-energy)] text-[var(--color-background)] font-mono-spec text-xs font-bold text-center">
                                REQUEST RECEIVED_
                            </div>
                        ) : (
                            <form onSubmit={handleNewsletter} className="flex flex-col gap-2">
                                <div className="flex flex-col md:flex-row gap-2">
                                    <input
                                        type="email"
                                        required
                                        placeholder="EMAIL ADDRESS"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="flex-1 bg-transparent border border-[var(--color-border-main)] p-3 font-mono-spec text-xs focus:outline-none focus:border-[var(--color-foreground)] min-w-0"
                                    />
                                    {!showTextArea && (
                                        <button disabled={status === 'LOADING'} className="bg-[var(--color-foreground)] text-[var(--color-background)] px-6 py-3 font-bold text-xs uppercase hover:bg-[var(--color-accent-brand)] transition-colors disabled:opacity-50 whitespace-nowrap">
                                            {status === 'LOADING' ? '...' : 'Notify'}
                                        </button>
                                    )}
                                </div>

                                {showTextArea && (
                                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                                        <textarea
                                            placeholder="Tell us about your requirements..."
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            rows={3}
                                            className="w-full bg-transparent border border-[var(--color-border-main)] p-3 font-mono-spec text-xs focus:outline-none focus:border-[var(--color-foreground)] resize-none"
                                        />
                                        <button disabled={status === 'LOADING'} className="w-full bg-[var(--color-foreground)] text-[var(--color-background)] px-6 py-3 font-bold text-xs uppercase hover:bg-[var(--color-accent-brand)] transition-colors disabled:opacity-50">
                                            {status === 'LOADING' ? 'Sending...' : 'Send Request'}
                                        </button>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Legal Details Expansion */}
            {legalSection && (
                <div className="max-w-7xl mx-auto mt-12 bg-gray-50 dark:bg-zinc-900 border border-[var(--color-border-main)] p-8">
                    <h3 className="font-bold text-xl mb-4 text-[var(--color-accent-prototype)]">{legalSection}</h3>
                    <p className="font-mono-spec text-sm opacity-80 leading-relaxed max-w-3xl">
                        {legalContent[legalSection]}
                    </p>
                </div>
            )}
        </div>
    );
};
