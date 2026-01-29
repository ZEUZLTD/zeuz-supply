import { PackageCheck, Truck, Flag } from 'lucide-react';

interface FulfillmentStatsProps {
    stats: {
        to_fulfill: number;
        shipped: number;
        completed: number;
    }
}

export default function FulfillmentStats({ stats }: FulfillmentStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-amber-50 p-6 border border-amber-200 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <PackageCheck className="w-16 h-16 text-amber-600" />
                </div>
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <PackageCheck className="w-4 h-4" /> TO FULLFILL (PAID)
                </h3>
                <div className="text-4xl font-mono font-black text-amber-900">{stats.to_fulfill}</div>
                <div className="text-xs text-amber-700 mt-2 font-medium">Orders waiting to be shipped</div>
            </div>

            <div className="bg-blue-50 p-6 border border-blue-200 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Truck className="w-16 h-16 text-blue-600" />
                </div>
                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> SHIPPED
                </h3>
                <div className="text-4xl font-mono font-black text-blue-900">{stats.shipped}</div>
                <div className="text-xs text-blue-700 mt-2 font-medium">Orders in transit</div>
            </div>

            <div className="bg-green-50 p-6 border border-green-200 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Flag className="w-16 h-16 text-green-600" />
                </div>
                <h3 className="text-xs font-bold text-green-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Flag className="w-4 h-4" /> COMPLETED
                </h3>
                <div className="text-4xl font-mono font-black text-green-900">{stats.completed}</div>
                <div className="text-xs text-green-700 mt-2 font-medium">Successfully delivered</div>
            </div>
        </div>
    );
}
