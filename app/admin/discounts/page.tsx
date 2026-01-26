import { VolumeDiscountManager } from "./VolumeDiscountManager";

export default function DiscountsPage() {
    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-black">DYNAMIC PRICING</h1>
                    <p className="text-gray-500 font-mono text-sm mt-2 max-w-2xl">
                        Global volume discount rules. Updates propagate to the storefront immediately.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold uppercase text-gray-400 bg-gray-100 px-3 py-1 rounded-full">System Wide</p>
                </div>
            </div>

            <VolumeDiscountManager />
        </div>
    );
}
