import { getRecentOrders, getOrderKPIs } from './actions';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Package, Truck, CheckCircle, AlertCircle, Search } from 'lucide-react';

export default async function OrdersPage() {
    // For now, fetching recent 50. In real world, use pagination query.
    const orders = await getRecentOrders(50);
    const kpis = await getOrderKPIs(); // Re-use for simple counts if needed or calculate specific status counts

    // Calculate Status Counts for "At A Glance"
    // Note: getRecentOrders might be limited, so these stats might be partial if not fetching all.
    // Ideally, make a new action `getOrderStats()` that does count(*).group_by(status).
    // For MVP, using what we have or just displaying list.

    // Hardcoded stats based on kpis (which fetches all currently in actions.ts)
    // We should probably update getOrderKPIs to return status breakdown.

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black">ORDERS</h1>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            placeholder="Search orders..."
                            className="pl-9 pr-4 py-2 border border-gray-200 text-sm font-mono focus:outline-none focus:border-black transition-colors min-w-[300px]"
                        />
                    </div>
                    <button className="bg-black text-white px-4 py-2 text-sm font-bold uppercase hover:bg-gray-800">
                        Filter
                    </button>
                </div>
            </div>

            {/* STATUS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-full text-blue-600"><AlertCircle size={16} /></div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">Processing</p>
                            <p className="text-xl font-black">{orders.filter(o => o.status === 'PROCESSING').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-50 p-2 rounded-full text-purple-600"><Package size={16} /></div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">To Ship</p>
                            <p className="text-xl font-black">{orders.filter(o => o.status === 'PAID').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-50 p-2 rounded-full text-gray-600"><Truck size={16} /></div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">Shipped</p>
                            <p className="text-xl font-black">{orders.filter(o => o.status === 'SHIPPED').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-full text-green-600"><CheckCircle size={16} /></div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">Completed</p>
                            <p className="text-xl font-black">{orders.filter(o => o.status === 'DELIVERED').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ORDER TABLE */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 uppercase text-xs text-gray-500 font-medium">
                        <tr>
                            <th className="p-4 border-b w-32">Order ID</th>
                            <th className="p-4 border-b w-40">Date</th>
                            <th className="p-4 border-b">Customer</th>
                            <th className="p-4 border-b text-center">Items</th>
                            <th className="p-4 border-b text-right">Total</th>
                            <th className="p-4 border-b text-center">Status</th>
                            <th className="p-4 border-b"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="p-4 text-xs font-bold">
                                    <Link href={`/admin/orders/${order.id}`} className="hover:underline text-blue-600">
                                        #{order.id.substring(0, 8)}
                                    </Link>
                                </td>
                                <td className="p-4 text-gray-500 text-xs">
                                    {new Date(order.created_at).toLocaleDateString()}
                                    <span className="block text-[10px] opacity-50">{new Date(order.created_at).toLocaleTimeString()}</span>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-xs truncate max-w-[200px]">{order.customer_email}</div>
                                    <div className="text-[10px] text-gray-400 uppercase truncate max-w-[200px]">
                                        {order.shipping_address ? (order.shipping_address as any).city : ''}
                                        {order.shipping_address ? ', ' + (order.shipping_address as any).country : ''}
                                    </div>
                                </td>
                                <td className="p-4 text-center text-xs text-gray-500">
                                    {order.items ? (Array.isArray(order.items) ? order.items.length : '1') : '-'}
                                </td>
                                <td className="p-4 text-right font-bold">£{((order.amount_total || 0) / 100).toFixed(2)}</td>
                                <td className="p-4 text-center">
                                    <span className={cn(
                                        "px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border",
                                        order.status === 'PAID' && "bg-green-50 text-green-700 border-green-200",
                                        order.status === 'PROCESSING' && "bg-blue-50 text-blue-700 border-blue-200",
                                        order.status === 'SHIPPED' && "bg-purple-50 text-purple-700 border-purple-200",
                                        order.status === 'DELIVERED' && "bg-gray-100 text-gray-700 border-gray-300",
                                        order.status === 'REFUNDED' && "bg-red-50 text-red-700 border-red-200",
                                        order.status === 'REFUNDED_NO_STOCK' && "bg-red-100 text-red-800 border-red-300"
                                    )}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <Link href={`/admin/orders/${order.id}`} className="text-[10px] border border-gray-300 px-3 py-1 hover:bg-black hover:text-white hover:border-black transition-all uppercase font-bold">
                                        Manage
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-12 text-center text-gray-400 italic text-sm">
                        No orders found.
                    </div>
                )}
            </div>
        </div>
    );
}
