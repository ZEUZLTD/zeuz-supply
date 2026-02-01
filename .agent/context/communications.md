# Communications & Signal Intelligence

## 1. Design Philosophy
All communications must match the "Void Black" / Monospace aesthetic of the website.
**No generic HTML templates.**

## 2. Transactional Emails (Resend)
Triggered by: `api/webhooks/stripe` or Admin Actions.

| Event | Template ID | Description |
| :--- | :--- | :--- |
| **Order Confirmed** | `order-confirmation` | Receipt, Manifesto, "We have received your signal." |
| **Order Shipped** | `shipping-update` | Tracking Number, Lab Report style status. |
| **Refund/Apology** | `stock-apology` | "Race condition failure. Refund initiated." (Automated). |

## 3. Newsletters
*   **Engine**: Resend Broadcasts.
*   **Segments**:
    *   `ALL_USERS`: General updates.
    *   `PREVIOUS_BUYERS`: Restock alerts for specific cells.
*   **Tone**: Brief, high-signal, text-heavy. "P45B RESTOCK. 1200 UNITS. GO."

## 4. Contact Forms
*   **Route**: `zeuz.supply/contact` -> Supabase `contact_submissions` -> Email Notification to Admin.
*   **SLA**: 24 Hour Response.
