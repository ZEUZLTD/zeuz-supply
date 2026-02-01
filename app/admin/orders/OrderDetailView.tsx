"use client";

import { useState } from "react";
import { Order } from "@/lib/types";
import { updateOrderStatus, refundOrder } from "./actions";
import { Check, Truck, Package, ArrowLeft, ExternalLink, AlertTriangle, CreditCard } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OrderDetailViewProps {
    order: Order;
}

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
        } catch {
            alert("Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!confirm("Are you sure you want to refund this order? This will immediately process a refund via Stripe.")) return;
        setIsLoading(true);
        try {
            await refundOrder(order.id);
            setStatus('REFUNDED');
            alert("Refund processed successfully!");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            alert(`Refund failed: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const shipping = order.shipping_address || {};
    const items = order.items || [];



    // Total Paid
    const shippingItem = items.find((i) => i.description === 'Shipping (DPD Next Day)');
    const shippingCost = shippingItem ? (shippingItem.amount_total as number) : 0;

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
                    {order.stripe_payment_intent_id && (
                        <a
                            href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`}
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
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Status Buttons */}
                    <button
                        onClick={() => handleStatusUpdate('PROCESSING')}
                        disabled={status !== 'PAID' && status !== 'PENDING' || isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 font-bold text-xs uppercase hover:bg-blue-100 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        <Package size={14} /> 1. Start Processing
                    </button>

                    <div className="h-px bg-gray-200 w-8" />

                    <div className="flex gap-2 items-center">
                        <input
                            placeholder="Tracking #"
                            value={tracking}
                            onChange={(e) => setTracking(e.target.value)}
                            className="border border-gray-300 px-2 py-1 text-xs w-32 font-mono h-8"
                        />
                        <input
                            placeholder="Carrier"
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                            className="border border-gray-300 px-2 py-1 text-xs w-24 h-8"
                        />
                        <button
                            onClick={() => handleStatusUpdate('SHIPPED')}
                            disabled={!tracking || status === 'SHIPPED' || status === 'DELIVERED' || isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 border border-purple-100 font-bold text-xs uppercase hover:bg-purple-100 disabled:opacity-50 disabled:grayscale transition-all h-8"
                        >
                            <Truck size={14} /> 2. Mark Shipped
                        </button>
                    </div>

                    <div className="h-px bg-gray-200 w-8" />

                    <button
                        onClick={() => handleStatusUpdate('DELIVERED')}
                        disabled={status !== 'SHIPPED' || isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 border border-green-100 font-bold text-xs uppercase hover:bg-green-100 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        <Check size={14} /> 3. Confirmed Delivered
                    </button>

                    <div className="flex-1" />

                    {(status !== 'REFUNDED' && status !== 'REFUNDED_NO_STOCK') && (
                        <button
                            onClick={handleRefund}
                            disabled={isLoading}
                            className="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-1.5 rounded transition-colors flex items-center gap-2 border border-transparent hover:border-red-100"
                        >
                            <AlertTriangle size={12} />
                            ISSUE REFUND
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ITEMS CARD */}
                <div className="md:col-span-2 bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-sm">ORDER MANIFEST</h3>
                        <span className="text-xs font-mono text-gray-400">ID: {order.id}</span>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Item</th>
                                <th className="px-6 py-3 font-medium text-right">Qty</th>
                                <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                                <th className="px-6 py-3 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item, i) => {
                                const metadata = item.price?.product_data?.metadata || {};
                                const originalPrice = metadata.original_unit_amount
                                    ? metadata.original_unit_amount / 100
                                    : null;
                                const discountDesc = metadata.discount_desc;
                                const finalUnitPrice = item.amount_total / item.quantity / 100;
                                const isDiscounted = originalPrice && (originalPrice > finalUnitPrice);

                                return (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="font-bold">{item.description}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-1">{item.price?.product}</div>
                                            {isDiscounted && (
                                                <div className="inline-block mt-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                                                    {discountDesc || 'DISCOUNT APPLIED'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right text-xs">
                                            {isDiscounted ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="line-through text-gray-400 opacity-70">£{originalPrice.toFixed(2)}</span>
                                                    <span className="font-blue-600 font-bold">£{finalUnitPrice.toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span>£{finalUnitPrice.toFixed(2)}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold font-mono">
                                            £{(item.amount_total / 100).toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Detailed Totals */}
                            <tr className="bg-gray-50/30">
                                <td colSpan={3} className="px-6 py-2 text-right text-xs font-bold text-gray-400 uppercase">Subtotal</td>
                                <td className="px-6 py-2 text-right font-mono text-sm text-gray-600">
                                    £{((order.amount_total - shippingCost) / 100).toFixed(2)}
                                </td>
                            </tr>
                            <tr className="bg-gray-50/30">
                                <td colSpan={3} className="px-6 py-2 text-right text-xs font-bold text-gray-400 uppercase">Shipping</td>
                                <td className="px-6 py-2 text-right font-mono text-sm text-gray-600">
                                    £{(shippingCost / 100).toFixed(2)}
                                </td>
                            </tr>
                            <tr className="bg-gray-100 border-t border-gray-200">
                                <td colSpan={3} className="px-6 py-4 text-right text-sm font-black text-black uppercase">Grand Total</td>
                                <td className="px-6 py-4 text-right font-black font-mono text-xl">
                                    £{(order.amount_total / 100).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* SHIPPING CARD */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-sm mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <Truck size={14} /> SHIPPING ADDRESS
                        </h3>
                        {shipping && shipping.line1 ? (
                            <div className="text-sm space-y-1 font-mono uppercase text-gray-600">
                                <div className="font-bold text-black mb-2 text-base">{shipping.name}</div>
                                <div>{shipping.line1}</div>
                                {shipping.line2 && <div>{shipping.line2}</div>}
                                <div>{shipping.city}</div>
                                <div>{shipping.postal_code}</div>
                                <div className="font-bold border-t border-dashed border-gray-200 pt-2 mt-2">{shipping.country}</div>
                            </div>
                        ) : (
                            <div className="p-4 bg-red-50 text-red-600 text-xs border border-red-100 rounded">
                                <strong>Missing Address Data.</strong><br />
                                Check Stripe Dashboard or Customer Email.
                            </div>
                        )}
                        {/* Copy Button */}
                        {shipping && shipping.line1 && (
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
                        )}
                    </div>

                    <div className="bg-white border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-sm mb-4 border-b border-gray-100 pb-2">CONTACT</h3>
                        <div className="text-sm space-y-2">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Email</label>
                                <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 hover:underline font-bold text-blue-600">
                                    {order.customer_email} <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-sm mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <CreditCard size={14} /> PAYMENT
                        </h3>
                        <div className="text-sm space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Transaction ID</label>
                                <div className="font-mono text-xs overflow-hidden text-ellipsis">
                                    {order.stripe_payment_intent_id || order.stripe_session_id}
                                </div>
                            </div>
                            <div>
                                <a
                                    href={order.stripe_payment_intent_id
                                        ? `https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`
                                        : `https://dashboard.stripe.com/payments/${order.stripe_session_id}` // Fallback
                                    }
                                    target="_blank"
                                    className="block w-full text-center bg-[#635BFF] hover:bg-[#5349E0] text-white font-bold py-2 text-xs rounded transition-colors"
                                >
                                    OPEN IN STRIPE
                                </a>
                                {order.stripe_payment_intent_id && (
                                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                                        View full risk analysis and payment logic in Stripe.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
