# ZEUZ_SUPPLY // 21700 ENERGY INFRASTRUCTURE

**Version**: 2.0.0 (Execution Phase)
**Stack**: Next.js 14 (App Router), Supabase (Auth/DB/Realtime), Stripe (Payments), Vercel (Deployment)

---

## 1. ARCHITECTURE & FLOW

The application operates as a Headless E-commerce platform with a strict "Server-Authoritative" security model.

### **Core Data Flow**
1.  **Product/Inventory**: Managed in `Supabase:products`.
2.  **Storefront (Client)**: Fetches cached data via `/api/live-inventory`.
    *   *Why?* To decouple the frontend from direct DB connects for public traffic (Performance).
3.  **Realtime State**: Client polls `/api/live-inventory` every 30s.
    *   Updates: Price, Stock, **Volume Discounts**, Voucher Validity.
4.  **Cart & Persistence**:
    *   **Local**: `localStorage` (zustand-persist) for guest users.
    *   **Server**: `Supabase:cart_items` for logged-in users.
    *   *Sync*: Cart merges automatically on login. Logic handles "Slugs" (Frontend) <-> "UUIDs" (Backend).
5.  **Checkout (The "Paranoid Check")**:
    *   Initiated securely via `/api/checkout`.
    *   **PROTOCOL**: The server RE-FETCHES all prices, stocks, and active discounts using the `Service Role Key` at the moment of creation. Client data is treated as untrusted.

### **Authentication**
*   **Method**: Supabase Magic Link / OTP.
*   **Role Based Access**:
    *   `public`: Browse & Buy.
    *   `admin`: Access `/admin` dashboard.
    *   *Note*: The legacy `zeuz_dev_admin` cookie backdoor provided in v1 has been **REMOVED** for security.

---

## 2. DIRECTORY STRUCTURE

| Path | Purpose |
| :--- | :--- |
| `app/api` | Server-side endpoints. Isolates critical logic (Checkout/Inventory) from client bundles. |
| `app/admin` | Protected Dashboard. Requires RLS `admin` role. |
| `components` | Reusable UI atoms. Strict "Industrial/Brutalist" styling rules apply. |
| `lib/store.ts` | Global State (Zustand). Handles Cart, User, & Theme. |
| `supabase/migrations` | SQL Source of Truth. **Always apply sequentially.** |
| `_legacy` | Deprecated/Zombie code. Do not use. Reference only. |

---

## 3. DESIGN SYSTEM (TEENAGE.ENGINEERING)

The codebase implements a specific aesthetic philosophy: **"Raw, Industrial, High-Fidelity."**

*   **Intentional Hacks**: Some layouts use "brute force" spacing or raw CSS grids to achieve a specific "broken/aligned" technical look. *Do not "fix" alignment unless it breaks usability.*
*   **Typography**: `JetBrains Mono` (Data/Spec) + `Inter Tight` (UI).
*   **Visual Logic**:
    *   **Power**: Red/Orange Accents.
    *   **Energy**: Green/Teal Accents.
    *   **Prototype**: Monochrome/Wireframe.

---

## 4. DEPLOYMENT & OPS

### **Prerequisites**
1.  **Supabase Project**: Apply migrations in `supabase/migrations`.
2.  **Stripe Account**: Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
3.  **Vercel**: Link repository.

### **Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_KEY=...             # Anon Key
SUPABASE_SERVICE_ROLE_KEY=...            # Critical for Checkout
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_URL=https://zeuz.supply
```

### **Onboarding**
```bash
git clone <repo>
npm install
npm run dev
# Access http://localhost:3000
```
