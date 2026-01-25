# ZEUZ_SUPPLY // 21700 ENERGY INFRASTRUCTURE

**Version**: 2.1.0 (Advanced Performance Refactor)
**Stack**: Next.js 14, Supabase (RT), Stripe Terminal/API, Framer Motion, Three.js (R3F)

---

## 1. THE ZEUZ PHILOSOPHY: INDUSTRIAL HIGH-FIDELITY

ZEUZ_SUPPLY is not a storefront. It is a **technical protocol** for the distribution of high-discharge Lithium-Ion modules. 

### **Design Language: Teenage.Engineering x Brutalism**
The platform's aesthetic is heavily influenced by the "Functional-Industrial" school of design, specifically the precision of **teenage.engineering**. 

*   **Tactile Feedback**: Every interaction—from the scroll-reactive 3D cell in the `HeroViewport` to the layout shifts—is designed to feel like operating a piece of high-end lab equipment.
*   **Typography as Specs**: We use **JetBrains Mono** for all data-sensitive text. The UI doesn't just display information; it presents it as a technical manifest.
*   **Visual Pillars**:
    *   **High Contrast**: Deep #0A0A0A backgrounds with high-luminance accents.
    *   **Modular Grids**: Everything is contained within strict borders and modular blocks, reflecting the physical structure of a battery rack.
    *   **Dynamic Branding**: The site theme shifts based on the "Energy Phase" (POWER/Orange, ENERGY/Green, PROTOTYPE/Grey).

---

## 2. TECHNICAL ARCHITECTURE: THE PARANOID MODEL

ZEUZ operates on a **Zero-Trust Inventory Model**. In a world of simultaneous bulk orders, "eventual consistency" is a failure.

### **The Paranoid Checkout Protocol**
While the frontend provides a smooth, real-time experience, the true authority lives in the **Server API (`/api/checkout`)**. 
-   **Atomic Re-Verification**: At the moment of checkout, the system bypasses all cached states and re-queries the database using the `Service Role Key`.
-   **Static Inventory Verification**: It checks real-time batches, global voucher usage caps, and volume discount tiers in a single transaction before passing the payload to Stripe.
-   **Price Protection**: If a price change is made in the Admin panel while a user is in the checkout flow, the server will catch the discrepancy and prevent the transaction, forcing a refresh.

### **Hybrid Persistence Matrix**
-   **Zustand (Transience)**: Handles rapid UI state, theme shifts, and instant cart updates.
-   **Supabase (Authority)**: Persistent storage for `cart_items` and `cart_sessions`.
-   **Hybrid Hydration (SEO)**: A `StoreHydrator` component injects server-side price/stock data directly into the client store on initial load, preventing "Flash of Unstyled Content" and ensuring correct Search Engine Indexing.

### **The "Red Team" Concurrency Defense**
To prevent overselling during high-traffic drops, we implement **Option B: Post-Payment Defense**.
-   **Conflict Detection**: The Stripe Webhook (`checkout.session.completed`) attempts an atomic stock decrement.
-   **Automatic Refund**: If stock is insufficient (Race Condition), the system *immediately* triggers a Stripe Refund and sends an apology email.
-   **Result**: Zero risk of unfulfillable orders, even with millisecond-level concurrency.

---

## 3. ADMIN INFRASTRUCTURE // THE CONTROL DECK

The `/admin` dashboard provides direct manipulation of the ZEUZ ecosystem.

### **Current Operational Modules**
-   **Dynamic Pricing Matrix**: A real-time editor for **Volume Discounts**. Adjust bulk quantity triggers (e.g., 2+, 10+, 100+) and their associated percentages instantly across the site.
-   **Infra-Marketing Control**: Toggle the "Global Splash" system, manage "Launch Counters," and adjust site-wide banners.
-   **Voucher Authority**: Create complex discount logic (Fixed, Percent, Fixed-Price, Free Shipping) with global usage limits and product-specific whitelists.
-   **Security**: The legacy dev-cookie backdoor has been deprecated in favor of a strict **RBAC (Role Based Access Control)** model tied to Supabase Auth.

---

## 4. THE ROADMAP: SCALING INFRASTRUCTURE

To bring ZEUZ to the next level of "Industrial Excellence," the following updates are planned:

### **Short-Term (Logic/Efficiency)**
-   [ ] **Predictive Stock Alerts**: Implementing a trigger system that notifies the Admin team when `stock_quantity - pending_orders` hits a 15% threshold.
-   [ ] **Per-Customer Pricing**: Custom "Contract Pricing" tiers for verified Business/Contractor accounts.
-   [ ] **Advanced Spec Graphs**: Integrate actual discharge curve data from `.csv` logs directly into the product spec views.

### **Medium-Term (Experience)**
-   [ ] **Physical Terminal Integration**: A local-deployment version of the ZEUZ interface for use in physical distribution centers.
-   [ ] **Batch Traceability**: Allow customers to see the specific production date and internal testing logs for the batch their cells belong to.

### **Long-Term (Logistics)**
-   [ ] **Real-time DPD Integration**: Live shipping tracking embedded directly in the `IDENTITY` tab of the Cart Manifest.
-   [ ] **The "Z-Hub"**: A customer portal for managing large-scale infrastructure projects and historical power usage data.

---

## 5. DEVELOPER COMMANDS

### **Development Initialize**
```bash
# Clone and Install
git clone https://github.com/zeuz/zeuz-supply.git
npm install

# Database Synchronization
npx supabase db push # Syncs Volume Discounts and Cart Tables

# Start Local Server
npm run dev
```

### **Paranoid Audit**
To run a full production sanity check:
```bash
npm run build # Validates Typings and 3D Asset Traces
```

---
*ZEUZ_SUPPLY - THE INFRASTRUCTURE OF POWER.*
