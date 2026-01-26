"use client";

import { useState } from "react";
import { Order } from "@/lib/types";
import { updateOrderStatus } from "./actions";
import { Check, Truck, Package, XCircle, ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OrderDetailViewProps {
    order: any; // Using any for flexible schema handling during dev
}

const steps = [
    { status: 'PAID', label: 'Paid', icon: Check },
    { status: 'PROCESSING', label: 'Processing', icon: Package },
    { status: 'SHIPPED', label: 'Shipped', icon: Truck },
    { status: 'DELIVERED', label: 'Delivered', icon: Check },
];

export function OrderDetailView({ order }: OrderDetailViewProps) {
    const [status, setStatus] = useState(order.status);
    const [tracking, setTracking] = useState(order.tracking_number || '');
    const [carrier, setCarrier] = useState(order.carrier || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!confirm(`Mark order as ${newStatus}?`)) return;
        setIsLoading(true);
        try {
            await updateOrderStatus(order.id, newStatus, tracking, carrier);
            setStatus(newStatus);
        } catch (e) {
            alert("Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };

    const shipping = order.shipping_address || {};
    const items = order.items || [];

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2">
                            ORDER <span className="font-mono opacity-50">#{order.id.slice(0, 8)}</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-mono">
                            {new Date(order.created_at).toLocaleString()} • {order.customer_email}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "px-3 py-1 text-sm font-bold uppercase rounded-full border",
                        status === 'PAID' && "bg-green-100 text-green-700 border-green-200",
                        status === 'PROCESSING' && "bg-blue-100 text-blue-700 border-blue-200",
                        status === 'SHIPPED' && "bg-purple-100 text-purple-700 border-purple-200",
                        status === 'DELIVERED' && "bg-gray-100 text-gray-700 border-gray-200",
                        status === 'REFUNDED' && "bg-red-100 text-red-700 border-red-200"
                    )}>
                        {status}
                    </span>
                    {order.stripe_session_id && (
                        <a
                            href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id || ''}`} // Ideally linking to payment
                            target="_blank"
                            className="bg-gray-100 hover:bg-gray-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                        >
                            STRIPE <ExternalLink size={10} />
                        </a>
                    )}
                </div>
            </div>

            {/* Workflow Pipeline */}
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">FULFILLMENT WORKFLOW</h3>
                <div className="flex items-center gap-4">
                    {/* Status Buttons */}
                    <button
                        onClick={() => handleStatusUpdate('PROCESSING')}
                        disabled={status !== 'PAID' && status !== 'PENDING'}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 font-bold text-xs uppercase hover:bg-blue-100 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        <Package size={14} /> 1. Start Processing
                    </button>

                    <div className="h-px bg-gray-200 w-8" />

                    <div className="flex gap-2">
                        <input
                            placeholder="Tracking #"
                            value={tracking}
                            onChange={(e) => setTracking(e.target.value)}
                            className="border border-gray-300 px-2 py-1 text-xs w-32 font-mono"
                        />
                        <input
                            placeholder="Carrier"
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                            className="border border-gray-300 px-2 py-1 text-xs w-24"
                        />
                        <button
                            onClick={() => handleStatusUpdate('SHIPPED')}
                            disabled={!tracking || status === 'SHIPPED' || status === 'DELIVERED'}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 border border-purple-100 font-bold text-xs uppercase hover:bg-purple-100 disabled:opacity-50 disabled:grayscale transition-all"
                        >
                            <Truck size={14} /> 2. Mark Shipped
                        </button>
                    </div>

                    <div className="h-px bg-gray-200 w-8" />

                    <button
                        onClick={() => handleStatusUpdate('DELIVERED')}
                        disabled={status !== 'SHIPPED'}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 border border-green-100 font-bold text-xs uppercase hover:bg-green-100 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        <Check size={14} /> 3. Confimed Delivered
                    </button>

                    <div className="flex-1" />

                    <button
                        onClick={() => {
                            if (confirm("Refund this order? This will trigger Stripe refund.")) {
                                handleStatusUpdate('REFUNDED');
                            }
                        }}
                        className="text-red-500 text-xs font-bold hover:underline opacity-50 hover:opacity-100"
                    >
                        ISSUE REFUND
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ITEMS CARD */}
                <div className="md:col-span-2 bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-sm">ORDER MANIFEST</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Item</th>
                                <th className="px-6 py-3 font-medium text-right">Qty</th>
                                <th className="px-6 py-3 font-medium text-right">Unit Details</th>
                                <th className="px-6 py-3 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item: any, i: number) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{item.description}</div>
                                        <div className="text-xs text-gray-400 font-mono">{item.price?.product}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right text-xs opacity-60">
                                        £{(item.amount_total / 100 / item.quantity).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold font-mono">
                                        £{(item.amount_total / 100).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {/* Totals */}
                            <tr className="bg-gray-50/50">
                                <td colSpan={3} className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total</td>
                                <td className="px-6 py-3 text-right font-black font-mono text-lg">
                                    £{(order.amount_total / 100).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* SHIPPING CARD */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-sm mb-4 border-b border-gray-100 pb-2">SHIPPING ADDRESS</h3>
                        <div className="text-sm space-y-1 font-mono uppercase text-gray-600">
                            <div className="font-bold text-black mb-2">{shipping.name}</div>
                            <div>{shipping.line1}</div>
                            {shipping.line2 && <div>{shipping.line2}</div>}
                            <div>{shipping.city}</div>
                            <div>{shipping.postal_code}</div>
                            <div className="font-bold">{shipping.country}</div>
                        </div>
                        {/* Copy Button */}
                        <button
                            onClick={() => {
                                const text = `${shipping.name}\n${shipping.line1}\n${shipping.line2 || ''}\n${shipping.city}\n${shipping.postal_code}\n${shipping.country}`;
                                navigator.clipboard.writeText(text);
                                alert("Address copied!");
                            }}
                            className="mt-4 w-full border border-dashed border-gray-300 py-2 text-xs font-bold text-gray-500 hover:border-gray-800 hover:text-black transition-colors"
                        >
                            COPY FOR LABEL
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-sm mb-4 border-b border-gray-100 pb-2">CONTACT</h3>
                        <div className="text-sm space-y-2">
                            <div>
                                <label className="text-xs text-gray-400 block">Email</label>
                                <a href={`mailto:${order.customer_email}`} className="hover:underline">{order.customer_email}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
