# ZEUZ_SUPPLY // 21700 ENERGY INFRASTRUCTURE

**Version**: 2.2.0 (Next.js 16 & Visual Fidelity)
**Last Audit**: 2026-02-04 22:55 UTC
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

## 2. TECHNICAL ARCHITECTURE: NEXT.JS 16 & REACT 19

The core rendering engine has been upgraded to the latest bleeding-edge stack to support high-performance 3D/WebGL contexts alongside Server Components.

### **Core Stack**
*   **Next.js 16 (Canary)**: Utilizing partial hydration and advanced server actions.
*   **React 19**: Leveraging concurrent rendering features for smoother 3D/UI interleaving.
*   **R3F v9 (React Three Fiber)**: The latest WebGL renderer, optimized for new React reconciliation.

### **3D Architecture (The Hero Cell)**
The `HeroViewport` component uses a novel "Clean GLB + Material Injection" pipeline to ensure stability across React 19's strict hydration boundaries.
*   **Geometry**: Sourced from `cell.glb` (Optimized v2).
*   **Material Injection**: Instead of relying on baked textures (which caused WebGL context loss in Next 16), we purely monitor the geometry and inject high-fidelity procedural materials at runtime:
    *   **Wrap**: Semi-Satin Plastic with dynamic procedural grain & color.
    *   **Terminals**: Matte Grey Metal (Roughness 0.6).
    *   **Tabs**: Polished Chrome (Metalness 1.0, Roughness 0.05).
    *   **Isolator**: Satin White.
*   **Interaction Physics**: The cell responds to scroll (Tumble X) and mouse position (Spin Y) with dampened LERP physics for weight.

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
-   **Performance Optimization**: "Interaction-Based Deferral" ensures the 3D Engine is dormant until user interaction.
-   **Deployment Tracking**: Publicly visible Git Commit SHA for version transparency.
-   **Security**: Strict **RBAC (Role Based Access Control)** model tied to Supabase Auth.
-   **Dashboard Intelligence**: Advanced sales visualization engine with dynamic date navigation.
-   **Commerce Security**: Implemented **Geographic Checkout Locking** on Stripe sessions.
-   **Promotion Analytics**: Financial reporting layer isolating "Promotional Spend."
-   **Loyalty & Identity Protocol**: Integrated account-locked voucher system.

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
3. **Architecture Scan** – Checks for dangerous patterns (e.g., `next/dynamic` + `ssr: false` on Canvas components)
4. **Fast Type Check** (`npx tsc --noEmit`) – Quick TypeScript validation
5. **Production Build** (`npm run build`) – Full Next.js build
6. **Runtime & Visual Verification** – Manual confirmation of local dev integrity

**Exit Criteria**: Deployment requires `Build`, `Type Check`, and `Architecture Scan` to pass.

> [!IMPORTANT]
> **Security Note**: As of v2.1.0, the `temp_dev_access.sql` "backdoor" policies have been REMOVED.
> All database operations (Batches, Products, Vouchers) now strictly require Authentication (RBAC).
> Ensure you are logged in as an Admin to perform write operations.

### **Documentation**
- [Email System Architecture](./email_system_guide.md): Details on triggers, templates, and the Industrial Design system.

---
*ZEUZ_SUPPLY - THE INFRASTRUCTURE OF POWER.*
