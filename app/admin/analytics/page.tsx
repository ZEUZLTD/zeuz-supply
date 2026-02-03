import { getOrderKPIs, getSalesOverTime } from '../orders/actions';
import { getDiscountAnalytics } from './actions';
import SalesChart from '../orders/sales-chart';

export default async function AnalyticsPage() {
    const kpis = await getOrderKPIs();
    const salesData = await getSalesOverTime();
    const discounts = await getDiscountAnalytics();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-black">ANALYTICS</h1>
                <div className="text-right">
                    <p className="text-sm font-mono text-gray-500">Live Data</p>
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <div className="bg-white p-6 border border-gray-200 shadow-sm bg-purple-50 border-purple-100">
                    <h3 className="text-xs font-bold uppercase text-purple-400 mb-2">Total Discounts</h3>
                    <div className="text-3xl font-black font-mono text-purple-700">£{discounts.total_discount_value.toFixed(2)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SALES CHART */}
                <div className="lg:col-span-2 bg-white p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-6">Revenue Trend</h2>
                    <SalesChart data={salesData} />
                </div>

                {/* VOUCHER & DISCOUNT BREAKDOWN */}
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden h-fit">
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold">PROMOTION PERFORMANCE</h3>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-white text-xs uppercase text-gray-400 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left">Code / Type</th>
                                    <th className="px-6 py-3 text-right">Uses</th>
                                    <th className="px-6 py-3 text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Volume Discounts */}
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-bold text-gray-600">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] mr-2">AUTO</span>
                                        VOLUME DISCOUNTS
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono">{discounts.volume_usage.count}</td>
                                    <td className="px-6 py-3 text-right font-mono font-bold">£{discounts.volume_usage.value.toFixed(2)}</td>
                                </tr>
                                {/* Vouchers */}
                                {discounts.voucher_usage.map((v, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-bold">
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] mr-2">VOUCHER</span>
                                            {v.code}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono">{v.count}</td>
                                        <td className="px-6 py-3 text-right font-mono font-bold">£{v.value.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {discounts.voucher_usage.length === 0 && discounts.volume_usage.value === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-400 text-xs italic">
                                            No discounts recorded in this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
