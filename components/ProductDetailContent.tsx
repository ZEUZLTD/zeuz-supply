"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCartStore, useUIStore } from "@/lib/store";
import { InventoryItem } from "@/lib/types";
import { X, Shield, FileText, Check, Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const MotionImage = motion.create(Image);

interface ProductDetailContentProps {
    product: InventoryItem;
    isModal?: boolean;
    onClose?: () => void;
}

import { useLiveProduct } from "@/hooks/useLiveProduct";
// ... imports

export const ProductDetailContent = ({ product: initialProduct, isModal = false, onClose }: ProductDetailContentProps) => {
    // Live Product Hook
    const product = useLiveProduct(initialProduct);

    const { user } = useUIStore();
    const { addItem } = useCartStore();
    const [quantity, setQuantity] = useState<number | string>(1);
    const [[page, direction], setPage] = useState([0, 0]);
    const [viewMode, setViewMode] = useState<'GALLERY' | 'DATASHEET' | 'MSDS' | 'BATCH'>('GALLERY');
    const [autoSubscribed, setAutoSubscribed] = useState<'PROTO_WAITLIST' | 'STOCK_NOTIFY' | null>(null);
    const [useDefaultImages, setUseDefaultImages] = useState(false);

    // Reset state when product changes (crucial for both modal and page nav)
    useEffect(() => {
        const initialQty = (product.stock_quantity || 0) > 0 ? 1 : 0;
        setQuantity(initialQty);
        setViewMode('GALLERY');
        setPage([0, 0]);
        setAutoSubscribed(null);
        setUseDefaultImages(false);
    }, [product]);

    const handleAutoNotify = async (type: 'PROTO_WAITLIST' | 'STOCK_NOTIFY') => {
        if (!user || !user.email) return false;

        const { error } = await supabase.from('inquiries').insert({
            email: user.email,
            type,
            metadata: {
                productId: product?.id,
                productModel: product?.model,
                quantity: typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity
            }
        });

        if (!error) {
            setAutoSubscribed(type);
            return true;
        }
        return false;
    };

    const defaultImages = [
        '/images/defaults/1.png',
        '/images/defaults/2.png',
        '/images/defaults/3.png',
        '/images/defaults/4.png',
        '/images/defaults/5.png',
    ];

    const currentSlug = product.slug;

    // Prefer DB images, then filesystem convention, then defaults
    let productImages: string[] = defaultImages;

    if (product.images && product.images.length > 0) {
        productImages = product.images;
    } else if (currentSlug) {
        productImages = [
            `/images/products/${currentSlug}/1.png`,
            `/images/products/${currentSlug}/2.png`,
            `/images/products/${currentSlug}/3.png`,
            `/images/products/${currentSlug}/4.png`,
            `/images/products/${currentSlug}/5.png`,
        ];
    }

    const galleryImages = (useDefaultImages || !currentSlug) ? defaultImages : productImages;
    const activeImage = Math.abs(page % galleryImages.length);

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0
        })
    };

    const isPrototype = product.category === "PROTOTYPE";
    const currentStock = product.stock_quantity || 0;
    const qtyNum = typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity;

    // Pricing Logic
    let discount = 0;
    if (qtyNum >= 100) discount = 0.20;
    else if (qtyNum >= 50) discount = 0.15;
    else if (qtyNum >= 10) discount = 0.10;
    else if (qtyNum >= 2) discount = 0.05;

    const basePrice = product.price || 0;
    const effectivePrice = basePrice * (1 - discount);

    return (
        <div className={cn("flex flex-col md:flex-row overflow-hidden bg-[var(--color-background)]", isModal ? "h-full w-full" : "min-h-screen pt-20 container mx-auto")}>
            {/* Close Button (Modal Only) */}
            {isModal && onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-2 border border-[var(--color-border-main)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors rounded-full bg-[var(--color-background)]"
                >
                    <X size={24} />
                </button>
            )}

            {/* LEFT: Image Gallery OR Document View */}
            <div className={cn("w-full md:w-1/2 bg-white border-r border-[var(--color-border-main)] relative flex flex-col p-4 md:p-8 group/gallery overflow-hidden shrink-0", isModal ? "h-[45vh] md:h-full" : "h-[40vh] md:h-[80vh]")}>
                {viewMode === 'GALLERY' ? (
                    <div className="flex-1 flex items-center justify-center relative w-full h-full">
                        {/* Arrow Left */}
                        <button
                            onClick={() => paginate(-1)}
                            className="absolute left-0 p-4 opacity-100 md:opacity-0 group-hover/gallery:opacity-100 transition-opacity z-20 text-black hover:text-[var(--color-accent-brand)]"
                        >
                            ←
                        </button>

                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                <MotionImage
                                    key={page}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.5 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={1}
                                    onDragEnd={(e, { offset, velocity }) => {
                                        const swipe = offset.x;
                                        if (swipe < -50) {
                                            paginate(1);
                                        } else if (swipe > 50) {
                                            paginate(-1);
                                        }
                                    }}
                                    src={galleryImages[activeImage]}
                                    alt={product.model}
                                    fill
                                    priority
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className={cn(
                                        "object-contain drop-shadow-2xl p-4 md:p-8",
                                        isPrototype && "opacity-80 sepia-[.5]"
                                    )}
                                    onError={() => setUseDefaultImages(true)}
                                />
                            </AnimatePresence>

                            {/* Hidden Preloader */}
                            <div className="hidden">
                                {galleryImages.map((src, i) => {
                                    const nextIndex = (activeImage + 1) % galleryImages.length;
                                    const prevIndex = (activeImage - 1 + galleryImages.length) % galleryImages.length;
                                    const shouldPreload = i === nextIndex || i === prevIndex;
                                    if (!shouldPreload) return null;
                                    return <Image key={src} src={src} alt="preload" width={10} height={10} priority={false} loading="eager" />;
                                })}
                            </div>
                        </div>

                        {/* Arrow Right */}
                        <button
                            onClick={() => paginate(1)}
                            className="absolute right-0 p-4 opacity-100 md:opacity-0 group-hover/gallery:opacity-100 transition-opacity z-20 text-black hover:text-[var(--color-accent-brand)]"
                        >
                            →
                        </button>

                        {/* Dots */}
                        <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                            {galleryImages.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage([i, i > activeImage ? 1 : -1])}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all border border-black/10",
                                        activeImage === i ? "bg-black w-4" : "bg-black/20"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    // Document View
                    <div className="flex-1 flex flex-col w-full h-full relative">
                        <button
                            onClick={() => setViewMode('GALLERY')}
                            className="absolute top-0 left-0 z-20 flex items-center gap-2 text-xs font-bold uppercase hover:text-[var(--color-accent-brand)] text-black"
                        >
                            ← Back to Gallery
                        </button>

                        <div className="flex-1 flex items-center justify-center border border-black/10 bg-gray-50 mt-8 p-8 shadow-sm">
                            <div className="text-center opacity-50 text-black">
                                <FileText size={48} className="mx-auto mb-4" />
                                <h3 className="font-bold mb-2">{viewMode} PREVIEW</h3>
                                <p className="text-xs font-mono-spec opacity-60 max-w-[200px] mx-auto">
                                    {product.model}_{viewMode}.pdf<br />
                                    (Placeholder Document)
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div >

            {/* RIGHT: Details & Actions */}
            <div className={cn("w-full md:w-1/2 flex-1 flex flex-col bg-[var(--color-background)] overflow-hidden relative", isModal ? "md:h-full" : "h-auto md:h-[80vh]")}>
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 min-h-0">
                    <div className="mb-2 flex items-center gap-2">
                        <span className={cn(
                            "px-2 py-1 text-xs font-bold uppercase tracking-wider",
                            product.category === 'POWER' ? "bg-[var(--color-accent-power)] text-[var(--color-background)]" :
                                product.category === 'ENERGY' ? "bg-[var(--color-accent-energy)] text-[var(--color-background)]" :
                                    "bg-[var(--color-accent-prototype)] text-[var(--color-foreground)]"
                        )}>
                            {product.tag}
                        </span>
                        <span className="font-mono-spec text-xs opacity-50">{product.id}</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2 leading-[0.9]">
                        {product.model}
                    </h1>

                    <div className="text-xl md:text-3xl font-mono-spec mb-6 text-[var(--color-accent-brand)]">
                        {product.spec}
                    </div>

                    <div className="prose prose-sm dark:prose-invert mb-8 opacity-80 font-mono-spec max-w-full text-sm md:text-base leading-snug">
                        <p>{product.pitch}</p>
                    </div>

                    {/* 2-Column Split: Specs & Volume */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        {/* LEFT (60%): Technical Stats */}
                        <div className="col-span-3">
                            <h4 className="font-bold text-[10px] uppercase mb-2 opacity-50 tracking-widest">TECHNICAL SPECS</h4>
                            <div className="grid grid-cols-1 gap-y-2 gap-x-4 border-t border-[var(--color-border-main)] py-2">
                                {/* Only show stats that exist */}
                                {product.nominal_voltage_v && (
                                    <div className="flex justify-between items-baseline border-b border-[var(--color-border-main)] pb-2">
                                        <span className="font-mono-spec text-xs opacity-60 uppercase">Nominal Voltage</span>
                                        <span className="font-bold font-mono-spec text-sm">{product.nominal_voltage_v}V</span>
                                    </div>
                                )}
                                {product.charge_voltage_v && (
                                    <div className="flex justify-between items-baseline border-b border-[var(--color-border-main)] pb-2">
                                        <span className="font-mono-spec text-xs opacity-60 uppercase">Charge Voltage</span>
                                        <span className="font-bold font-mono-spec text-sm">{product.charge_voltage_v}V</span>
                                    </div>
                                )}
                                {product.discharge_cutoff_v && (
                                    <div className="flex justify-between items-baseline border-b border-[var(--color-border-main)] pb-2">
                                        <span className="font-mono-spec text-xs opacity-60 uppercase">Discharge Cutoff</span>
                                        <span className="font-bold font-mono-spec text-sm">{product.discharge_cutoff_v}V</span>
                                    </div>
                                )}
                                {product.max_discharge_a && (
                                    <div className="flex justify-between items-baseline border-b border-[var(--color-border-main)] pb-2">
                                        <span className="font-mono-spec text-xs opacity-60 uppercase">Max Discharge</span>
                                        <span className="font-bold font-mono-spec text-sm text-[var(--color-accent-brand)]">{product.max_discharge_a}A</span>
                                    </div>
                                )}
                                {product.standard_charge_a && (
                                    <div className="flex justify-between items-baseline border-b border-[var(--color-border-main)] pb-2">
                                        <span className="font-mono-spec text-xs opacity-60 uppercase">Standard Charge</span>
                                        <span className="font-bold font-mono-spec text-sm">{product.standard_charge_a}A</span>
                                    </div>
                                )}
                                {product.ac_impedance_mohm && (
                                    <div className="flex justify-between items-baseline border-b border-[var(--color-border-main)] pb-2">
                                        <span className="font-mono-spec text-xs opacity-60 uppercase">AC Impedance</span>
                                        <span className="font-bold font-mono-spec text-sm">{product.ac_impedance_mohm}mΩ</span>
                                    </div>
                                )}
                                {product.weight_g && (
                                    <div className="flex justify-between items-baseline border-b border-[var(--color-border-main)] pb-2">
                                        <span className="font-mono-spec text-xs opacity-60 uppercase">Weight</span>
                                        <span className="font-bold font-mono-spec text-sm">{product.weight_g}g</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT (40%): Volume Protocols */}
                        <div className="col-span-2">
                            <div className="bg-zinc-900 text-white p-4 h-full border border-black/10">
                                <h4 className="font-bold text-[10px] uppercase mb-4 tracking-widest text-zinc-400">VOLUME PROTOCOLS</h4>
                                <div className="space-y-3 font-mono-spec text-sm">
                                    {[
                                        { qty: "2+", discount: "5%" },
                                        { qty: "10+", discount: "10%" },
                                        { qty: "50+", discount: "15%" },
                                        { qty: "100+", discount: "20%" }
                                    ].map((tier) => {
                                        const isActive =
                                            (tier.qty === "2+" && qtyNum >= 2 && qtyNum < 10) ||
                                            (tier.qty === "10+" && qtyNum >= 10 && qtyNum < 50) ||
                                            (tier.qty === "50+" && qtyNum >= 50 && qtyNum < 100) ||
                                            (tier.qty === "100+" && qtyNum >= 100);

                                        return (
                                            <div key={tier.qty} className={cn(
                                                "flex justify-between items-center p-3 border border-zinc-800 transition-colors",
                                                isActive ? "bg-[var(--color-accent-brand)] text-black border-transparent font-bold" : "bg-transparent opacity-60"
                                            )}>
                                                <span>{tier.qty}</span>
                                                <span>-{tier.discount}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Safety & Info Links */}
                    <div className="flex gap-6 mb-8">
                        <button
                            onClick={() => setViewMode('DATASHEET')}
                            className={cn("flex items-center gap-2 text-xs font-bold uppercase transition-opacity", viewMode === 'DATASHEET' ? "text-[var(--color-accent-brand)] opacity-100" : "opacity-50 hover:opacity-100")}
                        >
                            <FileText size={16} /> Datasheet
                        </button>
                        <button
                            onClick={() => setViewMode('MSDS')}
                            className={cn("flex items-center gap-2 text-xs font-bold uppercase transition-opacity", viewMode === 'MSDS' ? "text-[var(--color-accent-brand)] opacity-100" : "opacity-50 hover:opacity-100")}
                        >
                            <Shield size={16} /> MSDS / UN38.3
                        </button>
                    </div>
                </div>

                {/* Sticky Bottom Actions */}
                <div className="border-t border-[var(--color-border-main)] p-6 md:px-8 md:py-6 bg-[var(--color-background)] z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1 h-5">
                                <span className="text-[10px] font-mono-spec opacity-50 uppercase tracking-widest">PER UNIT</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-bold font-mono-spec">
                                        £{effectivePrice.toFixed(2)}
                                    </span>
                                    <span className={cn("text-xs line-through opacity-40 font-mono-spec transition-opacity", discount > 0 ? "opacity-40" : "opacity-0")}>
                                        £{basePrice.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-3">
                                <div className="text-3xl md:text-4xl font-mono-spec tracking-tighter">
                                    £{(effectivePrice * qtyNum).toFixed(2)}
                                </div>
                                {currentStock === 0 && !isPrototype && (
                                    <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
                                        OUT OF STOCK
                                    </span>
                                )}
                                {currentStock > 0 && qtyNum > currentStock && !isPrototype && (
                                    <span className="bg-[var(--color-accent-brand)] text-black px-2 py-1 text-xs font-bold uppercase tracking-wider">
                                        BULK ORDER
                                    </span>
                                )}
                            </div>

                            <div className={cn("text-xs text-[var(--color-accent-brand)] font-bold uppercase mt-1 h-4 transition-opacity", discount > 0 ? "opacity-100" : "opacity-0")}>
                                SAVED £{((basePrice * qtyNum) - (effectivePrice * qtyNum)).toFixed(2)}
                            </div>
                        </div>
                        <div className="font-mono-spec text-xs opacity-50 text-right">
                            <div className="mb-1">STOCK: {currentStock}</div>
                            <div className={cn("text-[var(--color-accent-brand)] transition-opacity", discount > 0 ? "opacity-100" : "opacity-0")}>BULK APPLIED</div>
                        </div>
                    </div>

                    <div className="flex gap-4 h-12 md:h-12">
                        <div className={cn("w-32 md:w-40 border border-[var(--color-foreground)] flex items-center justify-between px-1", currentStock === 0 && !isPrototype && "opacity-50 pointer-events-none")}>
                            <button
                                onClick={() => {
                                    const current = typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity;
                                    setQuantity(Math.max(1, current - 1));
                                }}
                                className="w-8 h-full flex items-center justify-center hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
                            >
                                <Minus size={16} />
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === "") {
                                        setQuantity("");
                                        return;
                                    }
                                    const num = parseInt(val);
                                    setQuantity(num);
                                }}
                                onBlur={() => {
                                    if (quantity === "" || (typeof quantity === 'number' && quantity < 1)) {
                                        setQuantity(1);
                                    }
                                }}
                                className="flex-1 w-full bg-transparent text-xl font-mono-spec focus:outline-none text-center appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                disabled={currentStock === 0 && !isPrototype}
                            />
                            <button
                                onClick={() => {
                                    const current = typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity;
                                    setQuantity(current + 1);
                                }}
                                className="w-8 h-full flex items-center justify-center hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {(() => {
                            if (isPrototype) {
                                const isJoined = autoSubscribed === 'PROTO_WAITLIST';
                                return (
                                    <button
                                        onClick={async () => {
                                            if (isJoined) return;
                                            const success = await handleAutoNotify('PROTO_WAITLIST');
                                            if (!success) {
                                                useUIStore.getState().setContactMode('PROTO_WAITLIST', {
                                                    productId: product.id,
                                                    productModel: product.model,
                                                    quantity: qtyNum
                                                });
                                                if (onClose) onClose();
                                                setTimeout(() => document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' }), 300);
                                            }
                                        }}
                                        className={cn(
                                            "flex-1 border text-sm md:text-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                            isJoined
                                                ? "bg-green-500 text-white border-green-500"
                                                : "bg-[var(--color-background)] border-[var(--color-foreground)] text-[var(--color-foreground)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)]"
                                        )}
                                    >
                                        {isJoined ? <><Check size={18} /> JOINED</> : "JOIN WAITLIST"}
                                    </button>
                                );
                            }

                            if (currentStock === 0) {
                                const isNotified = autoSubscribed === 'STOCK_NOTIFY';
                                return (
                                    <button
                                        onClick={async () => {
                                            if (isNotified) return;
                                            const success = await handleAutoNotify('STOCK_NOTIFY');
                                            if (!success) {
                                                useUIStore.getState().setContactMode('STOCK_NOTIFY', {
                                                    productId: product.id,
                                                    productModel: product.model
                                                });
                                                if (onClose) onClose();
                                                setTimeout(() => document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' }), 300);
                                            }
                                        }}
                                        className={cn(
                                            "flex-1 border text-sm md:text-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                            isNotified
                                                ? "bg-green-500 text-white border-green-500"
                                                : "bg-[var(--color-background)] border-[var(--color-foreground)] text-[var(--color-foreground)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)]"
                                        )}
                                    >
                                        {isNotified ? <><Check size={18} /> NOTIFIED</> : "NOTIFY RESTOCK"}
                                    </button>
                                );
                            }

                            if (qtyNum > currentStock) {
                                return (
                                    <button
                                        onClick={() => {
                                            useUIStore.getState().setContactMode('BULK_QUOTE', {
                                                productId: product.id,
                                                productModel: product.model,
                                                quantity: qtyNum
                                            });
                                            if (onClose) onClose();
                                            setTimeout(() => document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' }), 300);
                                        }}
                                        className="flex-1 bg-[var(--color-accent-brand)] text-black font-bold text-sm md:text-lg uppercase tracking-wider hover:brightness-110 transition-all border border-transparent"
                                    >
                                        REQUEST QUOTE
                                    </button>
                                );
                            }

                            return (
                                <button
                                    onClick={() => {
                                        addItem({
                                            id: product.id,
                                            model: product.model,
                                            price: product.price!,
                                            stock: product.stock_quantity
                                        }, qtyNum);
                                        if (onClose) onClose();
                                    }}
                                    className="flex-1 bg-[var(--color-foreground)] text-[var(--color-background)] font-bold text-sm md:text-lg uppercase tracking-wider hover:bg-[var(--color-accent-brand)] transition-colors"
                                >
                                    ADD TO MANIFEST
                                </button>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};
