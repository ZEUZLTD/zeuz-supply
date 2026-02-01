
import Link from 'next/link';
import SalesChart from './orders/sales-chart';
import { getOrderFulfillmentStats, getOrderKPIs, getRecentOrders, getSalesOverTime } from './orders/actions';
import DashboardControls from './components/DashboardControls';
import FulfillmentStats from './components/FulfillmentStats';
import { ArrowRight, Package, TrendingUp, Users } from 'lucide-react';
import { getStartEndDates, TimeframeMode } from '@/lib/date-utils';

export default async function AdminDashboard({ searchParams }: { searchParams: { mode?: string, date?: string, from?: string, to?: string } }) {
    const mode = (searchParams?.mode as TimeframeMode) || 'month';
    const dateParam = searchParams?.date;
    const refDate = dateParam ? new Date(dateParam) : new Date();

    // Calculate Date Range
    let { from, to, label } = getStartEndDates(mode, refDate);

    // Override if Custom
    if (mode === 'custom' && searchParams?.from) {
        from = searchParams.from;
        to = searchParams.to;
        label = `${from} - ${to}`;
    }

    // Determine grouping for chart
    let grouping: 'hour' | 'day' | 'month' = 'day';
    if (mode === 'today') grouping = 'hour';
    if (mode === 'year' || mode === 'financial_year') grouping = 'month';

    // Parallel data fetching
    const [kpis, recentOrders, salesData, fulfillmentStats] = await Promise.all([
        getOrderKPIs(from, to),
        getRecentOrders(5),
        getSalesOverTime(from, to, grouping),
        getOrderFulfillmentStats()
    ]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-4xl font-black">DASHBOARD</h1>
                <DashboardControls />
            </div>

            {/* FULFILLMENT STATS */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Order Fulfillment</h2>
                    <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                <FulfillmentStats stats={fulfillmentStats} />
            </section>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> REVENUE (TOTAL)
                    </h3>
                    <div className="text-3xl font-mono">£{kpis.totalRevenue.toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase font-bold">{label}</div>
                </div>
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" /> TOTAL ORDERS
                    </h3>
                    <div className="text-3xl font-mono">{kpis.totalOrders}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase font-bold">{label}</div>
                </div>
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" /> AVG ORDER VALUE
                    </h3>
                    <div className="text-3xl font-mono">£{kpis.aov.toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase font-bold">{label}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CHARTS */}
                <div className="lg:col-span-2 bg-white p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">SALES PERFORMANCE</h2>
                        <div className="text-xs font-bold uppercase text-gray-400">{label}</div>
                    </div>
                    <SalesChart data={salesData} />
                </div>

                {/* RECENT ORDERS */}
                <div className="bg-white p-6 border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                        <h2 className="text-xl font-bold">RECENT ORDERS</h2>
                        <Link href="/admin/orders" className="text-xs font-bold uppercase text-amber-600 hover:text-amber-500 flex items-center gap-1">
                            VIEW ALL <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {recentOrders.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 italic text-sm">No orders yet.</div>
                        ) : (
                            recentOrders.map((order) => (
                                <Link key={order.id} href={`/admin/orders/${order.id}`} className="block group">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 border border-gray-100 gap-2 group-hover:border-amber-200 group-hover:bg-amber-50 transition-colors">
                                        <div className="flex justify-between w-full sm:w-auto sm:block">
                                            <div className="font-bold text-sm group-hover:text-amber-700 transition-colors">#{order.stripe_session_id?.slice(-8) || order.id.slice(0, 8)}</div>
                                            <div className="text-xs text-gray-500 sm:mt-1">{new Date(order.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex justify-between w-full sm:w-auto sm:block sm:text-right items-center sm:items-end">
                                            <div className="font-mono text-sm font-bold">£{(order.amount_total / 100).toFixed(2)}</div>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm sm:mt-1 inline-block ${order.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
