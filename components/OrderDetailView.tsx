"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check, Clock, Package, Truck, AlertCircle, MapPin, CreditCard, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface OrderDetailViewProps {
    order: any;
    onBack: () => void;
}

export const OrderDetailView = ({ order, onBack }: OrderDetailViewProps) => {
    const [copied, setCopied] = useState(false);

    const copyId = () => {
        navigator.clipboard.writeText(order.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Parse Metadata if available
    const metadata = order.metadata || {};
    const shippingDetails = order.shipping_address || (metadata.shipping_details ? JSON.parse(metadata.shipping_details) : {});

    // Status Logic
    const steps = [
        { key: 'placed', label: 'PLACED', icon: Package, date: order.created_at },
        { key: 'paid', label: 'PAID', icon: CreditCard, date: order.created_at }, // Assumed instant if exists
        { key: 'processing', label: 'PROCESSING', icon: Clock, date: null },
        { key: 'shipped', label: 'SHIPPED', icon: Truck, date: null },
        { key: 'delivered', label: 'DELIVERED', icon: Check, date: null }
    ];

    const currentStatus = order.status || 'PENDING';

    // Determine active step index
    let activeIndex = 0;
    if (currentStatus === 'PAID') activeIndex = 1;
    if (currentStatus === 'PROCESSING') activeIndex = 2;
    if (currentStatus === 'SHIPPED') activeIndex = 3;
    if (currentStatus === 'DELIVERED') activeIndex = 4;
    if (currentStatus === 'REFUNDED') activeIndex = -1; // Special case

    // Calculate Financials
    const total = (order.amount_total || 0) / 100;
    const currency = (order.currency || 'GBP').toUpperCase();

    // items is usually Stripe Line Items
    const items = order.items || [];
    const subtotal = items.reduce((acc: number, item: any) => acc + (item.amount_total || (item.price?.unit_amount * item.quantity) || 0), 0) / 100;

    // Try to find shipping cost in items
    const shippingItem = items.find((i: any) => i.description?.toLowerCase().includes('shipping'));
    const shippingCost = shippingItem ? (shippingItem.amount_total / 100) : 0;

    // Filter out shipping from items list display
    const productItems = items.filter((i: any) => !i.description?.toLowerCase().includes('shipping'));

    // Voucher logic (if saved in metadata)
    const voucherCode = metadata.voucher_code;
    const volumeSavings = 0; // Hard to recalc without original price data, unless we saved it. 
    // If subtotal (sum of items) > total paid (minus shipping), there is a global discount
    const impliedDiscount = Math.max(0, (subtotal + shippingCost) - total);
    // Note: Stripe `amount_total` on line item is ALREADY discounted if we changed unit price.
    // So `subtotal` here is the *discounted* subtotal.
    // We can only show "Savings" if we have explicit metadata or original prices.
    // For now, we show what we have.

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border-main)] flex items-center justify-between bg-[#0A0A0A]">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[10px] font-mono-spec font-bold uppercase hover:text-[var(--color-accent-brand)] transition-colors"
                >
                    <ArrowLeft size={14} /> BACK TO HISTORY
                </button>
                <div className="text-[10px] font-mono-spec opacity-50">
                    ORDER DETAILS
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Order ID & Date */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h2 className="font-mono-spec text-xl font-bold tracking-tight text-[var(--color-foreground)]">
                            ORDER #{order.id.slice(0, 8)}...
                        </h2>
                        <button onClick={copyId} className="text-[var(--color-foreground)] hover:text-[var(--color-accent-brand)] transition-colors">
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                    <p className="font-mono-spec text-xs text-[var(--color-foreground)] opacity-60">
                        PLACED ON {new Date(order.created_at).toLocaleDateString()} AT {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                    {currentStatus === 'REFUNDED' && (
                        <div className="bg-red-500/10 border border-red-500/50 p-3 flex items-center gap-3 mt-2">
                            <AlertCircle className="text-red-500 w-5 h-5" />
                            <p className="text-red-500 font-mono-spec text-xs font-bold">ORDER REFUNDED</p>
                        </div>
                    )}
                </div>

                {/* Status Tracker */}
                {currentStatus !== 'REFUNDED' && (
                    <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--color-border-main)]" />
                        <div className="space-y-6 relative">
                            {steps.map((step, idx) => {
                                const isActive = idx <= activeIndex;
                                const isCurrent = idx === activeIndex;

                                return (
                                    <div key={step.key} className={cn("flex items-start gap-4 group", !isActive && "opacity-30")}>
                                        <div className={cn(
                                            "relative z-10 w-6 h-6 rounded-full border border-[var(--color-border-main)] bg-[var(--color-background)] flex items-center justify-center shrink-0 transition-colors",
                                            isActive && "border-[var(--color-accent-brand)] bg-[var(--color-accent-brand)] text-[var(--color-background)]",
                                            isCurrent && "ring-2 ring-[var(--color-accent-brand)] ring-offset-2 ring-offset-black"
                                        )}>
                                            <step.icon size={12} />
                                        </div>
                                        <div className="pt-0.5">
                                            <h4 className="font-mono-spec text-xs font-bold uppercase">{step.label}</h4>
                                            {step.date && (
                                                <p className="text-[9px] font-mono-spec opacity-50">{new Date(step.date).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Manifeset */}
                <div>
                    <h3 className="font-mono-spec text-xs font-bold uppercase tracking-wider text-[var(--color-accent-prototype)] mb-4 flex items-center gap-2">
                        <Package size={14} /> MANIFEST ({productItems.length})
                    </h3>
                    <div className="border border-[var(--color-border-main)] bg-[#0A0A0A] divide-y divide-[var(--color-border-main)]">
                        {productItems.map((item: any, i: number) => (
                            <div key={i} className="p-3 flex justify-between items-center group hover:bg-[var(--color-border-main)]/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-mono-spec font-bold">
                                        {item.quantity}x
                                    </div>
                                    <div>
                                        <p className="font-mono-spec text-xs font-bold text-[var(--color-foreground)]">{item.description || item.price?.product?.name || 'UNKNOWN ITEM'}</p>
                                        <p className="font-mono-spec text-[9px] opacity-50">UNIT: £{((item.price?.unit_amount || item.amount_total / item.quantity) / 100).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="font-mono-spec text-xs font-bold">
                                    £{((item.amount_total || 0) / 100).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logistics */}
                <div>
                    <h3 className="font-mono-spec text-xs font-bold uppercase tracking-wider text-[var(--color-accent-prototype)] mb-4 flex items-center gap-2">
                        <Truck size={14} /> LOGISTICS
                    </h3>
                    <div className="bg-[#111] p-4 border border-[var(--color-border-main)] space-y-4">
                        {order.tracking_number ? (
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <div>
                                    <p className="text-[9px] font-mono-spec opacity-50 uppercase mb-1">TRACKING CHECKPOINT</p>
                                    <p className="font-mono-spec text-sm font-bold text-[var(--color-accent-brand)] tracking-wider">{order.tracking_number}</p>
                                    <p className="text-[10px] font-mono-spec opacity-50 mt-1">{order.carrier || 'DPD NEXT DAY'}</p>
                                </div>
                                <button
                                    onClick={() => window.open(`https://www.google.com/search?q=${order.tracking_number}`, '_blank')}
                                    className="text-[10px] bg-white text-black px-2 py-1 font-bold font-mono-spec hover:opacity-80"
                                >
                                    TRACK
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-[var(--color-accent-power)] opacity-70">
                                <Clock size={14} />
                                <span className="text-[10px] font-mono-spec font-bold">AWAITING DISPATCH</span>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            <MapPin size={14} className="mt-0.5 opacity-50" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-mono-spec opacity-50 uppercase">DESTINATION</p>
                                {shippingDetails.line1 ? (
                                    <div className="text-xs font-mono-spec text-[var(--color-foreground)] leading-relaxed">
                                        <p>{shippingDetails.name || order.customer_name}</p>
                                        <p>{shippingDetails.line1}</p>
                                        {shippingDetails.line2 && <p>{shippingDetails.line2}</p>}
                                        <p>{shippingDetails.city}, {shippingDetails.postal_code}</p>
                                        <p>{shippingDetails.country}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs font-mono-spec opacity-50 italic">No address data linked.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financials */}
                <div className="border-t border-[var(--color-border-main)] pt-4 space-y-2">
                    <div className="flex justify-between font-mono-spec text-[10px] opacity-60">
                        <span>SUBTOTAL</span>
                        <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    {/* If we had explicit discount saving data, we would render here. 
                        Since we modify unit price, implicit savings are hidden. 
                        Show Voucher if present. */}
                    {voucherCode && (
                        <div className="flex justify-between font-mono-spec text-[10px] text-[var(--color-accent-brand)]">
                            <span>VOUCHER ({voucherCode})</span>
                            <span>APPLIED</span>
                        </div>
                    )}
                    <div className="flex justify-between font-mono-spec text-[10px] opacity-60">
                        <span>SHIPPING</span>
                        <span>{shippingCost === 0 ? "FREE" : `£${shippingCost.toFixed(2)}`}</span>
                    </div>

                    <div className="flex justify-between font-mono-spec text-lg text-[var(--color-foreground)] border-t border-[var(--color-border-main)] pt-3 mt-2">
                        <span>TOTAL</span>
                        <span className="font-bold">£{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
