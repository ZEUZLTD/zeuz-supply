"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

interface SalesChartProps {
    data: { date: string; revenue: number }[];
}

export default function SalesChart({ data }: SalesChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400 font-mono text-sm border border-dashed bg-gray-50">
                NO SALES DATA YET
            </div>
        );
    }

    return (
        <div className="w-full h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#999" }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#999" }}
                        tickFormatter={(val) => `£${val}`}
                    />
                    <Tooltip
                        contentStyle={{ background: '#000', border: 'none', borderRadius: '4px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(val: number | undefined) => [`£${Number(val || 0).toFixed(2)}`, 'Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#000"
                        fill="#f3f4f6"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
