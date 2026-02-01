# Business Logic & Protocols

## 1. Checkout Protocol: "The Paranoid Model"
We operate on a **Zero-Trust** basis. The frontend is for display; the backend is the authority.

### The Flow
1.  **User adds to cart**: Stored in `cart_items` (Supabase).
2.  **Checkout initiated**:
    *   **Server Verification**: API `/api/checkout` queries the DB directly.
    *   **Stock Check**: Verifies `stock_quantity` > `cart_quantity`.
    *   **Price Check**: Re-calculates total based on DB prices (ignoring frontend values).
    *   **Discount Application**: Applies volume tier OR voucher (whichever is valid).
3.  **Payment (Stripe)**: Session created with "GB-Only" shipping restriction.
4.  **Webhook (`checkout.session.completed`)**:
    *   **Atomic Decrement**: `stock_quantity` reduced.
    *   **Race Condition Request**: If stock < 0 after decrement, **IMMEDIATE REFUND** triggered.

## 2. Pricing Logic

### A. Volume Discounts (Automatic)
*   **Source**: `volume_discounts` table.
*   **Logic**: Applied per-product based on quantity.
*   **Tiers (Typical)**:
    *   2+ Units: ~2% Off
    *   10+ Units: ~5% Off
    *   100+ Units: ~12% Off

### B. Vouchers (Manual)
*   **Source**: `vouchers` table.
*   **Logic**: Can apply to specific products or global cart.
*   **Priority**: Vouchers stack with volume discounts ONLY if `allow_stacking` is true (Rare).

## 3. Inventory Status
*   **LIVE**: Available for purchase.
*   **PROTOTYPE**: Visible but not purchaseable ("COMING SOON").
*   **ARCHIVED**: Hidden from main grid.
