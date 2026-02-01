
export type SectionType = "POWER" | "ENERGY" | "PROTOTYPE";

export interface VolumeTier {
    min_quantity: number;
    discount_percent: number;
}

export interface InventoryItem {
    id: string;
    model: string;
    spec: string;
    tag: string;
    pitch: string;
    price: number | null;
    category: SectionType;
    status: "IN_STOCK" | "LOW_STOCK" | "COMING_SOON" | "OUT_OF_STOCK";
    stock_quantity?: number;
    // Extended Technical Stats
    weight_g?: number;
    nominal_voltage_v?: number;
    charge_voltage_v?: number;
    discharge_cutoff_v?: number;
    standard_charge_a?: number;
    max_discharge_a?: number;
    ac_impedance_mohm?: number;
    graph_data?: Record<string, unknown>;
    priority: number;
    batch_test_url?: string | null;
    slug?: string;
    // hasImage?: boolean; // REMOVED
    images?: string[];
    batches?: Batch[];
}

export interface Batch {
    id: string;
    product_id: string;
    batch_code: string;
    stock_quantity: number;
    status: 'LIVE' | 'ARCHIVED' | 'DRAFT';
    supplier_reference?: string | null;
    received_date?: string | null;
    created_at?: string;
    graph_data?: Record<string, unknown> | null;
}


export interface Order {
    id: string;
    stripe_session_id: string;
    stripe_payment_intent_id?: string;
    customer_email: string;
    shipping_address: {
        name?: string;
        line1?: string;
        line2?: string;
        city?: string;
        postal_code?: string;
        country?: string;
    };
    status: string;
    amount_total: number;
    currency: string;
    items: Array<{
        description: string;
        quantity: number;
        amount_total: number;
        price?: {
            product?: string;
            product_data?: {
                metadata?: {
                    original_unit_amount?: number;
                    discount_desc?: string;
                };
            };
        };
    }>;
    tracking_number?: string;
    carrier?: string;
    created_at: string;
}

export interface Voucher {
    id: string;
    code: string;
    type: 'PERCENT' | 'FIXED' | 'FIXED_PRICE';
    discount_percent?: number | null;
    discount_amount?: number | null;
    active: boolean;
    used_count: number;
    min_spend?: number | null;
    product_ids?: string[] | null;
    max_usage_per_cart?: number | null;
    max_global_uses?: number | null;
    start_date?: string | null;
    expiry_date?: string | null;
    is_free_shipping: boolean;
    is_first_order_only?: boolean;
    allowed_emails?: string[] | null;
    created_at?: string;
}
