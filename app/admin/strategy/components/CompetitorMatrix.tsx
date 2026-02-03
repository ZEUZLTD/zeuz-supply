
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HARDCODED_DATA = [
    {
        name: 'Molicel P42A',
        ZEUZ_Target: 3.95, // Hero Tier est
        NuBattery: 6.99,
        CellSupply: 3.05,
        NKON_Landed: 2.80, // Approx with shipping
    },
    {
        name: 'Molicel P45B',
        ZEUZ_Target: 5.50,
        NuBattery: 9.99,
        CellSupply: 4.55,
        NKON_Landed: 4.30,
    },
    {
        name: 'Samsung 50S',
        ZEUZ_Target: 3.95,
        NuBattery: 9.99,
        CellSupply: 3.35,
        NKON_Landed: 2.50,
    },
    {
        name: 'Samsung 50E',
        ZEUZ_Target: 2.95,
        NuBattery: 7.99,
        CellSupply: 2.75,
        NKON_Landed: 1.50,
    },
];

export default function CompetitorMatrix() {
    return (
        <div className="space-y-6">
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-black mb-6">Price Benchmarking (Qty 1-10 Average)</h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={HARDCODED_DATA}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} unit="£" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb' }}
                                itemStyle={{ color: '#111' }}
                            />
                            <Legend />
                            <Bar dataKey="ZEUZ_Target" name="ZEUZ Limit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="NuBattery" name="Retail (Nu)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="CellSupply" name="Wholesale (CellS)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="NKON_Landed" name="EU Bulk (NKON)" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-gray-100 text-gray-500 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-xs font-bold uppercase">Model</th>
                            <th className="p-4 text-xs font-bold uppercase text-amber-600">ZEUZ Target</th>
                            <th className="p-4 text-xs font-bold uppercase">NuBattery</th>
                            <th className="p-4 text-xs font-bold uppercase">CellSupply</th>
                            <th className="p-4 text-xs font-bold uppercase">NKON (Est. Landed)</th>
                            <th className="p-4 text-xs font-bold uppercase text-right">Opp. Gap</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {HARDCODED_DATA.map((row) => (
                            <tr key={row.name} className="hover:bg-amber-50 transition-colors">
                                <td className="p-4 font-bold text-black">{row.name}</td>
                                <td className="p-4 text-amber-600 font-bold">£{row.ZEUZ_Target.toFixed(2)}</td>
                                <td className="p-4 text-gray-500">£{row.NuBattery.toFixed(2)}</td>
                                <td className="p-4 text-gray-500">£{row.CellSupply.toFixed(2)}</td>
                                <td className="p-4 text-gray-500">£{row.NKON_Landed.toFixed(2)}</td>
                                <td className="p-4 text-right text-green-600 font-bold">
                                    +£{(row.NuBattery - row.ZEUZ_Target).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
