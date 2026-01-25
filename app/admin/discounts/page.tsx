import { VolumeDiscountManager } from "./VolumeDiscountManager";

export default function DiscountsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-[#333] pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter text-white mb-2">DYNAMIC PRICING</h1>
                    <p className="text-[#666] font-mono text-sm max-w-2xl">
                        Configure automated volume-based discount tiers. These rules apply globally to all products unless overridden by specific exceptions. Changes update in real-time.
                    </p>
                </div>
            </div>

            <VolumeDiscountManager />
        </div>
    );
}
