"use client";

import { motion } from "framer-motion";
import { useCartStore, useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { InventoryItem } from "@/lib/types";
import { Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Simplified Card Logic
// Just minimal details + Image
// Click triggers view

export const CellCard = ({ item }: { item: InventoryItem }) => {
    const isPrototype = item.category === "PROTOTYPE";
    // Smart default: If server says no image, start with default to prevent 404
    const initialImage = item.hasImage !== false ? (item.slug ? `/images/products/${item.slug}/1.png` : "/images/defaults/1.png") : "/images/defaults/1.png";
    const [imgSrc, setImgSrc] = useState(initialImage);
    const isOOS = (item.stock_quantity || 0) <= 0 && !isPrototype;

    const hoverColorClass = item.category === 'POWER' ? 'group-hover:text-[var(--color-accent-power)]' :
        item.category === 'ENERGY' ? 'group-hover:text-[var(--color-accent-energy)]' :
            item.category === 'PROTOTYPE' ? 'group-hover:text-[var(--color-accent-prototype)]' :
                'group-hover:text-[var(--color-foreground)]';

    const itemsTagColor = item.category === 'POWER' ? 'bg-[var(--color-accent-power)] text-[var(--color-background)] border-transparent' :
        item.category === 'ENERGY' ? 'bg-[var(--color-accent-energy)] text-[var(--color-background)] border-transparent' :
            'bg-[var(--color-foreground)] text-[var(--color-background)] border-transparent';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => useUIStore.getState().setViewingProduct(item.id)}
            onMouseEnter={() => useUIStore.getState().setHoveredProduct(item.model)}
            onMouseLeave={() => useUIStore.getState().setHoveredProduct(null)}
            className={cn(
                "group relative flex flex-col justify-between border-r border-b border-[var(--color-border-main)] bg-[var(--color-background)] h-[400px] p-6 cursor-pointer hover:ring-1 hover:ring-[var(--color-foreground)] hover:z-10 transition-all overflow-hidden",
                isOOS && "opacity-50 grayscale-[0.8]"
            )}>
            {/* OOS Overlay: TE Technical Badge + Cross */}
            {isOOS && (
                <>
                    <div className="absolute top-4 right-4 z-20">
                        <div className="flex items-center gap-2 bg-[var(--color-background)] border border-red-500/50 px-3 py-1.5 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="font-mono-spec text-[10px] font-bold text-red-500 tracking-widest uppercase">
                                Out of Stock
                            </span>
                        </div>
                    </div>
                    {/* Corner to Corner Cross */}
                    <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none opacity-50">
                        <line x1="0" y1="0" x2="100%" y2="100%" stroke="red" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                        <line x1="100%" y1="0" x2="0" y2="100%" stroke="red" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    </svg>
                </>
            )}

            {/* OOS Visual Dimming (Keep image dim) */}
            {isOOS && <div className="absolute inset-0 z-10 bg-[var(--color-background)]/10 mix-blend-saturation pointer-events-none" />}

            {/* Prototype Overlay: COMING SOON Badge */}
            {isPrototype && (
                <div className="absolute top-4 right-4 z-20">
                    <div className="flex items-center gap-2 bg-[var(--color-background)] border border-[var(--color-accent-prototype)]/50 px-3 py-1.5 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-accent-prototype)]" />
                        <span className="font-mono-spec text-[10px] font-bold text-[var(--color-accent-prototype)] tracking-widest uppercase">
                            COMING SOON
                        </span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start z-10 relative pointer-events-none">
                <div>
                    <h3 className={cn("font-mono-spec text-2xl font-bold tracking-tighter uppercase mb-1 transition-colors", hoverColorClass)}>
                        <Link href={`/products/${item.slug || item.id}`} onClick={(e) => e.stopPropagation()}>
                            {item.model}
                        </Link>
                    </h3>
                    <p className="font-mono-spec text-xs text-[var(--color-accent-brand)]">
                        {item.spec}
                    </p>
                </div>
                <div className="font-mono-spec text-sm font-bold">
                    £{item.price?.toFixed(2)}
                </div>
            </div>

            {/* Centered Large Image */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[300px] h-[300px] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12 relative">
                    <Image
                        src={imgSrc}
                        alt={item.model}
                        fill
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" // Transparent placeholder
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={cn(
                            "object-contain drop-shadow-2xl transition-all",
                            isPrototype && "opacity-50"
                        )}
                        onError={() => setImgSrc("/images/defaults/1.png")}
                    />
                </div>
            </div>

            {/* Bottom Tech/Tag (Colored) */}
            <div className="relative z-10 flex justify-between items-end pointer-events-none">
                <div className={cn(
                    "px-2 py-1 text-[10px] font-bold uppercase tracking-wider border bg-[var(--color-background)]",
                    isPrototype ? "bg-[var(--color-accent-prototype)] text-white border-transparent" : itemsTagColor
                )}>
                    {item.tag}
                </div>

                <div className="pointer-events-auto">
                    {!isPrototype && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Scroll to Section Info (The Graph Section)
                                const id = `${item.category}_INFO`;
                                const element = document.getElementById(id);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                }
                            }}
                            className="font-mono-spec text-[10px] uppercase opacity-50 hover:opacity-100 hover:text-[var(--color-accent-brand)] hover:scale-105 transition-all cursor-pointer flex items-center gap-1"
                        >
                            <Info size={12} />
                            VIEW DISCHARGE DATA
                        </button>
                    )}
                </div>
            </div>

            {/* Prototype Overlay (Subtle) */}
            {
                isPrototype && (
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)]" />
                )
            }
        </motion.div >
    );
};
