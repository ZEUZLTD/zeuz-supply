
export interface PricingScenario {
    batchName: string; // e.g., "Molicel P45B"
    landedCost: number; // Cost per cell DDP (GBP)
    packagingCostPerOrder: number; // Cost for box/label per order
    labelCostPerCell: number; // Cost for wrap/label per cell
}

export interface QuantityTier {
    qty: number;
    shippingMethod: string;
    shippingCost: number; // Net cost to merchant
}

// Shipping Rate Assumptions (Net costs approx)
const SHIPPING_RATES: QuantityTier[] = [
    { qty: 1, shippingMethod: 'RM Tracked 48 (LL)', shippingCost: 2.70 }, // Large Letter
    { qty: 4, shippingMethod: 'RM Tracked 48 (LL)', shippingCost: 2.70 }, // Still fits? Maybe not all. 
    // Actually strategy doc says: 1-12 cells -> RM Tracked 48 LL (PIP box)
    { qty: 12, shippingMethod: 'RM Tracked 48 (LL)', shippingCost: 2.70 },
    { qty: 25, shippingMethod: 'RM Tracked 48 (Parcel)', shippingCost: 4.50 }, // Small Parcel
    { qty: 50, shippingMethod: 'DPD Next Day', shippingCost: 7.50 },
    { qty: 100, shippingMethod: 'UPS Standard', shippingCost: 9.50 },
    { qty: 200, shippingMethod: 'UPS Standard (Heavy)', shippingCost: 15.00 },
];

export interface CalculationResult {
    qty: number;
    unitLandedCost: number;
    unitPackagingCost: number; // (Label*Qty + Box) / Qty
    unitShippingCost: number; // Shipping / Qty
    totalUnitCost: number; // Landed + Pack + Ship

    targetMargin: number; // %
    suggestedSalePriceIncVat: number;
    actualSalePriceIncVat: number; // User override or rounded

    netProfitTotal: number;
    netProfitPerUnit: number;
    marginPercent: number; // (Sale - VAT - TotalCost) / (Sale - VAT)
}

export function getShippingForQty(qty: number): { cost: number; method: string } {
    // Logic from STRATEGY.md:
    // 1-12: LL (~2.70-3.30)
    // 13-25: Small Parcel (~4.50)
    // 40-65: DPD (~7.50)
    // 100: UPS (~9.50)

    if (qty <= 12) return { cost: 2.85, method: 'Royal Mail T48 (LL)' }; // Averaging slightly up for packing materials
    if (qty <= 25) return { cost: 4.50, method: 'Royal Mail T48 (Pacrel)' };
    if (qty <= 65) return { cost: 6.95, method: 'DPD Next Day' };
    return { cost: 9.50, method: 'UPS Standard' };
}

export function calculateTier(
    scenario: PricingScenario,
    qty: number,
    targetMarginPercent: number
): CalculationResult {
    const { cost, method } = getShippingForQty(qty);

    const totalShipping = cost;
    const totalPackaging = scenario.packagingCostPerOrder + (scenario.labelCostPerCell * qty);

    const unitLanded = scenario.landedCost;
    const unitPack = totalPackaging / qty;
    const unitShip = totalShipping / qty;

    const totalUnitCost = unitLanded + unitPack + unitShip;

    // Reverse calculate target price from margin
    // Profit = (PriceExVAT - Cost)
    // Margin = Profit / PriceExVAT
    // PriceExVAT = Cost / (1 - Margin)

    const marginDecimal = targetMarginPercent / 100;
    const targetPriceExVat = totalUnitCost / (1 - marginDecimal);
    const targetPriceIncVat = targetPriceExVat * 1.2;

    return {
        qty,
        unitLandedCost: unitLanded,
        unitPackagingCost: unitPack,
        unitShippingCost: unitShip,
        totalUnitCost,
        targetMargin: targetMarginPercent,
        suggestedSalePriceIncVat: Number(targetPriceIncVat.toFixed(2)),
        actualSalePriceIncVat: Number(targetPriceIncVat.toFixed(2)), // Default to target
        netProfitTotal: 0, // Calculated later when actual price is finalized
        netProfitPerUnit: 0,
        marginPercent: 0
    };
}

export function recalculateProfit(
    baseResult: CalculationResult,
    actualPriceIncVat: number
): CalculationResult {
    const priceExVat = actualPriceIncVat / 1.2;
    const totalRevenueExVat = priceExVat * baseResult.qty;
    const totalCost = baseResult.totalUnitCost * baseResult.qty;
    const profit = totalRevenueExVat - totalCost;

    return {
        ...baseResult,
        actualSalePriceIncVat: actualPriceIncVat,
        netProfitTotal: Number(profit.toFixed(2)),
        netProfitPerUnit: Number((profit / baseResult.qty).toFixed(2)),
        marginPercent: Number(((profit / totalRevenueExVat) * 100).toFixed(2))
    };
}
