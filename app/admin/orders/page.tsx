import { getOrderKPIs, getRecentOrders, getSalesOverTime } from './actions';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const SalesChart = dynamic(() => import('./sales-chart'), {
    ssr: false,
    loading: () => <div className="w-full h-[300px] bg-gray-50 animate-pulse" />
});

export default async function OrdersPage() {
    const kpis = await getOrderKPIs();
    const recentOrders = await getRecentOrders();
    const salesData = await getSalesOverTime();

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-black">ORDERS & ANALYTICS</h1>
                <div className="text-right">
                    <p className="text-sm font-mono text-gray-500">Live Data</p>
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Total Revenue</h3>
                    <div className="text-3xl font-black font-mono">£{kpis.totalRevenue.toFixed(2)}</div>
                </div>
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Total Orders</h3>
                    <div className="text-3xl font-black font-mono">{kpis.totalOrders}</div>
                </div>
                <div className="bg-white p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Avg. Order Value</h3>
                    <div className="text-3xl font-black font-mono">£{kpis.aov.toFixed(2)}</div>
                </div>
            </div>

            {/* SALES CHART */}
            <div className="bg-white p-8 border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6">Revenue Trend</h2>
                <SalesChart data={salesData} />
            </div>

            {/* RECENT ORDERS */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Recent Orders</h2>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 uppercase text-xs">
                        <tr>
                            <th className="p-4 border-b">ID</th>
                            <th className="p-4 border-b">Date</th>
                            <th className="p-4 border-b">Customer</th>
                            <th className="p-4 border-b">Total</th>
                            <th className="p-4 border-b">Status</th>
                            {/* <th className="p-4 border-b text-right">Action</th> */}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                        {recentOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-xs opacity-50">{order.id.substring(0, 8)}...</td>
                                <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                                <td className="p-4 font-bold">{order.customer_email || 'Guest'}</td>
                                <td className="p-4 text-[#FF4400]">£{((order.amount_total || 0) / 100).toFixed(2)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                {/* <td className="p-4 text-right"><Link href={`/admin/orders/${order.id}`} className="underline">VIEW</Link></td> */}
                            </tr>
                        ))}
                        {recentOrders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                                    No orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
