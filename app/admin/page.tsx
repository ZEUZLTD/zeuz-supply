import Link from 'next/link';
import SalesChart from './orders/sales-chart';
import { getOrderKPIs, getRecentOrders, getSalesOverTime } from './orders/actions';
import { ArrowRight, Package, TrendingUp, Users } from 'lucide-react';

export default async function AdminDashboard() {
    const kpis = await getOrderKPIs();
    const recentOrders = await getRecentOrders(5);
    const salesData = await getSalesOverTime();

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-black">DASHBOARD</h1>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> REVENUE (TOTAL)
                    </h3>
                    <div className="text-3xl font-mono">£{kpis.totalRevenue.toFixed(2)}</div>
                </div>
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" /> TOTAL ORDERS
                    </h3>
                    <div className="text-3xl font-mono">{kpis.totalOrders}</div>
                </div>
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" /> AVG ORDER VALUE
                    </h3>
                    <div className="text-3xl font-mono">£{kpis.aov.toFixed(2)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CHARTS */}
                <div className="lg:col-span-2 bg-white p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">SALES PERFORMANCE</h2>
                        <select className="text-xs border-none bg-gray-50 p-2 font-bold uppercase text-gray-500 cursor-not-allowed">
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <SalesChart data={salesData} />
                </div>

                {/* RECENT ORDERS */}
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">RECENT ORDERS</h2>
                        <Link href="/admin/orders" className="text-xs font-bold uppercase text-amber-600 hover:text-amber-500 flex items-center gap-1">
                            VIEW ALL <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {recentOrders.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 italic text-sm">No orders yet.</div>
                        ) : (
                            recentOrders.map((order: any) => (
                                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100">
                                    <div>
                                        <div className="font-bold text-sm">#{order.stripe_session_id?.slice(-8) || order.id.slice(0, 8)}</div>
                                        <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-sm font-bold">£{(order.amount_total / 100).toFixed(2)}</div>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 ${order.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
