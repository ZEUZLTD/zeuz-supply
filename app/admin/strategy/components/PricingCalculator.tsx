
'use client';

import { useState, useEffect } from 'react';
import { PricingScenario, CalculationResult, calculateTier, recalculateProfit } from '../lib/pricing-logic';

const TIERS = [1, 4, 10, 25, 50, 100];

export default function PricingCalculator() {
    const [scenario, setScenario] = useState<PricingScenario>({
        batchName: 'Molicel P45B',
        landedCost: 3.05,
        packagingCostPerOrder: 0.50,
        labelCostPerCell: 0.10
    });

    const [targetMargin, setTargetMargin] = useState(30); // 30% default
    const [results, setResults] = useState<CalculationResult[]>([]);

    useEffect(() => {
        const calculated = TIERS.map(qty => {
            const base = calculateTier(scenario, qty, targetMargin);
            return recalculateProfit(base, base.suggestedSalePriceIncVat);
        });
        setResults(calculated);
    }, [scenario, targetMargin]);

    const handlePriceOverride = (index: number, newPrice: number) => {
        const newResults = [...results];
        newResults[index] = recalculateProfit(newResults[index], newPrice);
        setResults(newResults);
    };

    return (
        <div className="space-y-8 text-sm font-mono">

            {/* INPUTS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div>
                    <label className="block text-gray-500 mb-2 text-xs uppercase font-bold">Batch / Cell Name</label>
                    <input
                        type="text"
                        value={scenario.batchName}
                        onChange={(e) => setScenario({ ...scenario, batchName: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 p-2 text-black rounded focus:border-amber-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-gray-500 mb-2 text-xs uppercase font-bold">Landed Cost (GBP)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={scenario.landedCost}
                        onChange={(e) => setScenario({ ...scenario, landedCost: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-gray-50 border border-gray-200 p-2 text-black rounded focus:border-amber-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-gray-500 mb-2 text-xs uppercase font-bold">Target Margin (%)</label>
                    <input
                        type="number"
                        value={targetMargin}
                        onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 p-2 text-black rounded focus:border-amber-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-gray-500 mb-2 text-xs uppercase font-bold">Pack/Label Cost</label>
                    <div className="flex gap-2">
                        <input
                            placeholder="Order"
                            type="number"
                            step="0.10"
                            value={scenario.packagingCostPerOrder}
                            onChange={(e) => setScenario({ ...scenario, packagingCostPerOrder: parseFloat(e.target.value) || 0 })}
                            className="w-1/2 bg-gray-50 border border-gray-200 p-2 text-black rounded focus:border-amber-500 outline-none"
                        />
                        <input
                            placeholder="Cell"
                            type="number"
                            step="0.01"
                            value={scenario.labelCostPerCell}
                            onChange={(e) => setScenario({ ...scenario, labelCostPerCell: parseFloat(e.target.value) || 0 })}
                            className="w-1/2 bg-gray-50 border border-gray-200 p-2 text-black rounded focus:border-amber-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* RESULTS TABLE */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-500 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-xs uppercase font-bold">Qty</th>
                            <th className="p-4 text-xs uppercase font-bold">Cost Breakdown (Unit)</th>
                            <th className="p-4 text-xs uppercase font-bold">Break-Even (Inc VAT)</th>
                            <th className="p-4 w-48 text-xs uppercase font-bold">Sale Price (Inc VAT)</th>
                            <th className="p-4 text-right text-xs uppercase font-bold">Net Profit</th>
                            <th className="p-4 text-right text-xs uppercase font-bold">Margin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {results.map((res, idx) => (
                            <tr key={res.qty} className="hover:bg-amber-50 transition-colors">
                                <td className="p-4 font-bold text-black">{res.qty}</td>
                                <td className="p-4 text-xs text-gray-500">
                                    <div>Landed: £{res.unitLandedCost.toFixed(2)}</div>
                                    <div>Ship: £{res.unitShippingCost.toFixed(2)}</div>
                                    <div>Pack: £{res.unitPackagingCost.toFixed(2)}</div>
                                    <div className="text-gray-400 mt-1">Total: £{res.totalUnitCost.toFixed(2)}</div>
                                </td>
                                <td className="p-4 text-gray-400">
                                    £{(res.totalUnitCost * 1.2).toFixed(2)}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">£</span>
                                        <input
                                            type="number"
                                            step="0.05"
                                            value={res.actualSalePriceIncVat}
                                            onChange={(e) => handlePriceOverride(idx, parseFloat(e.target.value) || 0)}
                                            className={`w-24 bg-gray-50 border px-2 py-1 rounded outline-none font-bold ${res.marginPercent < 15 ? 'border-red-300 text-red-600' :
                                                    res.marginPercent > 35 ? 'border-green-300 text-green-600' : 'border-gray-200 text-black'
                                                }`}
                                        />
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">
                                        Ex VAT: £{(res.actualSalePriceIncVat / 1.2).toFixed(2)}
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono">
                                    <div className={res.netProfitTotal > 0 ? "text-green-600" : "text-red-600"}>
                                        £{res.netProfitTotal.toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                        £{res.netProfitPerUnit.toFixed(2)} / unit
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${res.marginPercent < 15 ? 'bg-red-100 text-red-600' :
                                            res.marginPercent > 30 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {res.marginPercent}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="text-xs text-gray-400 p-4 border border-gray-200 border-dashed rounded bg-gray-50">
                ** NOTE: Calculations assume Standard Rate 20% VAT. Shipping costs are estimated net costs.
                Packaging assumes standard PIP boxes or double-walled cartons.
            </div>
        </div>
    );
}
