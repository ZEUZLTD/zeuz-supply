# ZEUZ_SUPPLY // 21700 ENERGY INFRASTRUCTURE

**Version**: 2.1.0 (Advanced Performance Refactor)
**Agent System**: [Active - See .agent/README.md](.agent/README.md)

---

## 🤖 AI AGENT NOTICE
**Are you an LLM/Agent working on this repo?**
> **STOP.** Read [.agent/README.md](.agent/README.md) **IMMEDIATELY.**
> It contains the "Brain" of the project: Tech Stack, Design System, & Business Logic.

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

### **Logistics & Audit Protocols**
-   **Geo-Locked Fulfillment**: Infrastructure is cryptographically restricted to **United Kingdom (GB)** contexts only. Attempted routing to non-compliant zones is rejected at the API level (Stripe Session Configuration).
-   **Audit Fidelity**: Every transaction carries a payload of metadata (original unit cost vs. discount source) to ensure the financial ledger remains the single source of truth, immune to frontend pricing display errors.

---

## 3. ADMIN INFRASTRUCTURE // THE CONTROL DECK

The `/admin` dashboard provides direct manipulation of the ZEUZ ecosystem.

### **Current Operational Modules**
-   **Dynamic Pricing Matrix**: A real-time editor for **Volume Discounts**. Adjust bulk quantity triggers (e.g., 2+, 10+, 100+) and their associated percentages instantly across the site. Loads dynamically from Supabase for instant updates.
-   **Infra-Marketing Control**: Toggle the "Global Splash" system, manage "Launch Counters," and adjust site-wide banners.
-   **Voucher Authority**: Create complex discount logic (Fixed, Percent, Fixed-Price, Free Shipping) with global usage limits and product-specific whitelists.
-   **Fulfillment Control**: Enhanced order processing workflow with granular status updates and better fulfilling controls.
-   **Abandoned Cart Recovery**: Automated "Cart Capture" system that saves incomplete checkouts to the database for retargeting, with integrated email recovery through Resend.
-   **Post-Purchase Fidelity**: A complete overhaul of the "Order Success" state. The Cart Drawer now transforms into a granular "Order Status" tracker (Paid -> Shipped -> Completed) with detailed financial breakdowns.
-   **Transactional Communications**: High-fidelity email system powered by Resend. Automatically triggers branded, data-rich emails for Order Confirmations, Shipping Updates, and Stock Apologies.
-   **Performance Optimization**: TBT (Total Blocking Time) reduced from 15,300ms to **60ms** relative to baseline. Implemented an "Interaction-Based Deferral" strategy where the 3D Engine is completely dormant until user interaction (scroll/pointer), achieving a Lighthouse Performance score of 90+.
-   **Deployment Tracking**: Publicly visible Git Commit SHA (v2.1.0) for version transparency.
-   **Security**: The legacy dev-cookie backdoor has been deprecated in favor of a strict **RBAC (Role Based Access Control)** model tied to Supabase Auth.
-   **Dashboard Intelligence**: Advanced sales visualization engine with dynamic date navigation (Day, Week, Month, Year, Financial Year, Custom Range) and a focused "Order Fulfillment" summary to track paid, shipped, and completed orders efficiently.
-   **Commerce Security**: Implemented **Geographic Checkout Locking** on Stripe sessions to prevent shipping rate exploitation. By enforcing "GB-only" shipping address collection at the payment gateway, we ensure that the shipping fees calculated on the frontend match the final delivery destination.
-   **Promotion Analytics**: New financial reporting layer that isolates "Promotional Spend." A dedicated view tracks the financial impact of Volume Discounts vs. Voucher Codes, giving precise visibility into margin reduction from marketing activities.
-   **Loyalty & Identity Protocol**: Integrated account-locked voucher system. Automates 15% reward assignment on order completion, restricted by a strict `allowed_emails` matrix and "First Order Only" initiation checks to prevent promotional leakage.

### **Tactical Communication Matrix**
ZEUZ now operates a dedicated "Signal Intelligence" layer for automated user communications (`zeuz.supply` / `zeuz.co.uk`).
-   **Resend Integration**: High-fidelity transactional email delivery.
-   **Templated Protocols**: Database-driven email templates for "Order Shipped", "Contact Acknowledgment", and "Newsletter Welcome" events.
-   **Industrial Design System**: All outgoing communications now match the site's "Void Black" and "Monospace" aesthetic.
-   **Template Visualization**: Admin dashboard includes real-time HTML previewing for all email templates before deployment.
-   **Manifest Visualization**: The order history UI provides a granular "Order Status" tracker (Paid -> Shipped -> Completed) with deep-linking to tracking checkpoints and financial breakdowns.
-   **Mobile Infrastructure**: Complete mobile rework of the Admin Dashboard. Features a responsive paranoid-navigation system, touch-optimized inventory management for on-the-go adjustments, and flexible grids for real-time monitoring on any device.

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
- **Analytics**: Real-time sales data, conversion metrics, and revenue tracking.
- **Strategy Engine**: Built-in business strategy documentation and pricing models for AI agents (`/admin/strategy`).
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

### **Gatekeeper Protocol**
Before deployment, run the full audit:
```bash
node scripts/gatekeeper.js
```

**The Gatekeeper performs 6 sequential checks:**
1. **Security Audit** (`npm audit --audit-level=high`) – Flags high/critical vulnerabilities
2. **Linting** (`npm run lint`) – Advisory check for code quality
3. **Fast Type Check** (`npx tsc --noEmit`) – Quick TypeScript validation
4. **Production Build** (`npm run build`) – Full Next.js build
5. **Runtime & Visual Verification** – Manual confirmation of local dev integrity (Homepage, Admin, Terminal)
6. **Database Reminder** – Manual prompt to run `npx supabase db push`

**Exit Criteria**: Deployment requires `Type Check`, `Build`, and `Runtime Verification` to pass. Lint is advisory-only.

> [!IMPORTANT]
> **Security Note**: As of v2.1.0, the `temp_dev_access.sql` "backdoor" policies have been REMOVED.
> All database operations (Batches, Products, Vouchers) now strictly require Authentication (RBAC).
> Ensure you are logged in as an Admin to perform write operations.

### **Documentation**
- [Email System Architecture](./email_system_guide.md): Details on triggers, templates, and the Industrial Design system.

---
*ZEUZ_SUPPLY - THE INFRASTRUCTURE OF POWER.*
