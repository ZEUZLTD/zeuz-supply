# Email System Architecture

This document details the configuration, triggers, and management of the ZEUZ Email System.

## 1. System Overview
The system uses **Resend** (API) for delivery and **Supabase** (Database) for template storage.
-   **API Provider**: Resend (API Key in `.env.local`)
-   **Template Store**: `email_templates` table in Supabase.
-   **Sender Identity**: `orders@zeuz.co.uk` (Requires Domain Verification).

## 2. Trigger Map (When emails are sent)

> [!NOTE]
> **Industrial Design System**: All templates default to the "Void Black" / "Monospace" theme. Use the Admin "Preview" button to verify the aesthetic.

| Event | Trigger Location | Template Key | Description |
| :--- | :--- | :--- | :--- |
| **Order Placed** | `/lib/order-utils.ts` (inside `handleOrderCompletion`) | `order_confirmation` | Sent immediately after successful Stripe payment. Contains Order ID and Total. |
| **Stock Failure** | `/lib/order-utils.ts` (inside `handleOrderCompletion`) | `stock_apology` | Sent if payment succeeds but stock runs out during processing (Race Condition). |
| **Order Shipped** | `/app/admin/orders/actions.ts` (inside `updateOrderStatus`) | `order_shipped` | Sent when Admin updates status to `SHIPPED`. Contains Tracking ID. |
| **Contact Form** | `/app/actions/inquiry.ts` | `contact_acknowledgment` | Auto-reply sent when a user submits the `/contact` form. |
| **Newsletter** | `/app/actions/inquiry.ts` | `newsletter_welcome` | Sent when a user signs up for the newsletter. |
| **Order Delivered** | `/app/admin/orders/actions.ts` | `order_delivered` | Sent when order is `COMPLETED`. Contains dynamic reward code. |

## 3. Template Management
Templates are stored as HTML in the database to allow editing without redeploying the code.

### How to Edit Templates
1.  Navigate to the **Admin Dashboard**: `http://localhost:3000/admin`
2.  Go to **Marketing > Email Templates**.
3.  Click **PREVIEW** to check the current rendering.
4.  Click **EDIT** on the template you wish to modify.
5.  Update the **Subject** or **Body HTML**.
6.  Click **SAVE**.

### Available Variables
When editing HTML, you can use `{{variable_name}}` placeholders.

**Order Confirmation (`order_confirmation`)**
-   `{{order_id}}`: e.g., "57466fd1..."
-   `{{total}}`: Total amount (e.g., "150.00")
-   `{{currency}}`: e.g., "GBP"
-   `{{items_html}}`: Auto-generated HTML grid of purchased products.
-   `{{order_link}}`: Direct link to the order on the website.

**Order Shipped (`order_shipped`)**
-   `{{order_id}}`: Order ID
-   `{{tracking_number}}`: The tracking code entered in Admin.
-   `{{carrier}}`: The courier name (e.g., "DPD").
-   `{{items_html}}`: HTML manifest of shipped items.
-   `{{order_link}}`: Link to order details.

**Order Delivered (`order_delivered`)**
-   `{{order_id}}`: Order ID
-   `{{voucher_code}}`: The 15% reward code (`PROTOCOL_REWARD`) auto-assigned to the user.

**Contact (`contact_acknowledgment`)**
-   `{{type}}`: "GENERAL", "WHOLESALE", etc.
-   `{{message_preview}}`: First 50 chars of their message.

## 4. Troubleshooting
**"Domain not verified" Error**:
If emails fails with `403 Forbidden`, you must verify the domain `zeuz.co.uk` in the [Resend Dashboard](https://resend.com/domains).
-   Add DNS records (DKIM/SPF) provided by Resend to your DNS provider.
