"use client";

import { cn } from "@/lib/utils";
import { SectionType, InventoryItem } from "@/lib/types";
import { useRef } from "react";
import { useInView } from "framer-motion";
import dynamic from 'next/dynamic';

const DischargeGraph = dynamic(() => import('./DischargeGraph').then(mod => mod.DischargeGraph), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100/50 animate-pulse" />
});

export const SectionInfo = ({ type, products }: { type: SectionType, products: InventoryItem[] }) => {
    if (type === 'PROTOTYPE') return null;

    const ref = useRef(null);
    // Trigger when within 200px of viewport
    const isInView = useInView(ref, { once: true, margin: "200px" });

    return (
        <div ref={ref} className="col-span-full border-b border-[var(--color-border-main)] bg-white text-black font-mono-spec flex flex-col justify-center" id={`${type}_INFO`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 w-full">
                {/* Text Column - 1/3 Width */}
                <div className="col-span-1 border-r border-[var(--color-border-main)] p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                    <h3 className="text-4xl lg:text-5xl font-black tracking-tighter mb-6 leading-none">{type}<br />SERIES</h3>
                    <p className="text-sm opacity-70 leading-relaxed max-w-sm">
                        {type === 'POWER' ? "High discharge rate cells designed for extreme output. Optimized for thermal stability. Benchmark impedance."
                            : "High capacity cells for maximum range. Energy density leader. Optimized for cycle life."}
                    </p>
                </div>

                {/* Graph Column - 2/3 Width */}
                <div className="col-span-1 lg:col-span-2 bg-gray-50/30 p-8 md:p-12 flex items-center justify-center relative overflow-hidden h-[500px] md:h-auto">
                    {isInView ? (
                        <div className="w-full h-full max-w-4xl">
                            <DischargeGraph type={type} products={products} />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-transparent" />
                    )}
                </div>
            </div>
        </div>
    );
};
