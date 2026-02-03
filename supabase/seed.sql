-- SEED DATA for ZEUZ SUPPLY
-- Run this in Supabase SQL Editor to populate your store

insert into products (slug, name, brand, category, spec, tag, pitch, price_gbp, image_url) values
-- POWER
('tp-50xg', 'TENPOWER INR-50XG', 'Tenpower', 'POWER', '5000mAh / 40A', 'THE KING', 'The Low-Resistance King. Runs cooler than the Samsung 50S. Verified 4mΩ.', 5.50, '/assets/cyl-red.png'),
('sam-50s', 'SAMSUNG 50S', 'Samsung', 'POWER', '5000mAh / 25A', 'BENCHMARK', 'The Industry Standard. We stock this so you can see just how much better the 50XG is.', 5.80, '/assets/cyl-red.png'),
('mol-p50b', 'MOLICEL P50B', 'Molicel', 'POWER', '5000mAh / 60A', 'UNICORN', 'The true successor to the P45B. Limited allocation only.', 8.00, '/assets/cyl-red.png'),
-- ENERGY
('lg-m58t', 'LG M58T', 'LG', 'ENERGY', '5800mAh / 12.5A', 'RANGE KING', 'Highest capacity Tier-1 cell in the UK. 16% more range than a 50E.', 6.20, '/assets/cyl-green.png'),
('tp-58he', 'TENPOWER 58HE', 'Tenpower', 'ENERGY', '5800mAh / 10A', 'VALUE', 'The Value Alternative to LG. Massive capacity, lower price.', 4.50, '/assets/cyl-green.png'),
('vap-f63', 'FEB 6250 / VAPCELL F63', 'Vapcell', 'ENERGY', '6250mAh / 12.5A', 'SPEC WINNER', 'Breaking the 6Ah barrier. Silicon-Carbon technology available today.', 7.50, '/assets/cyl-green.png'),
-- PROTOTYPE
('tp-60xg', 'TENPOWER 60XG', 'Tenpower', 'PROTOTYPE', '6000mAh / 40A', 'HOLY GRAIL', 'Capacity + 40A Discharge. The future of E-Bikes.', null, '/assets/cyl-grey.png'),
('mol-p60b', 'MOLICEL P60B', 'Molicel', 'PROTOTYPE', '6000mAh / 100A', 'DANGEROUS', 'The cell that makes mechanical mods dangerous again.', null, '/assets/cyl-grey.png'),
('mol-m65a', 'MOLICEL M65A', 'Molicel', 'PROTOTYPE', '6500mAh / 26A', 'LIMIT BREAK', 'The absolute physical limit of the 21700 format.', null, '/assets/cyl-grey.png')
on conflict (slug) do nothing;

-- 2. Insert Batches (Stock)
with p as (select id, slug from products)
insert into batches (product_id, batch_code, stock_quantity, status, arrival_date, acir_avg)
select id, 'INIT-STOCK-' || upper(slug), 100, 'LIVE', now(), 0.0
from p
where slug in ('tp-50xg', 'sam-50s', 'lg-m58t', 'tp-58he', 'vap-f63');

-- Special cases for Low Stock / Future
with p as (select id, slug from products)
insert into batches (product_id, batch_code, stock_quantity, status, arrival_date, acir_avg)
select id, 'LOW-ALLOC-' || upper(slug), 5, 'LIVE', now(), 0.0
from p where slug = 'mol-p50b';

-- Prototypes (Testing / Coming Soon)
with p as (select id, slug from products)
insert into batches (product_id, batch_code, stock_quantity, status, arrival_date, acir_avg)
select id, 'PROTO-' || upper(slug), 0, 'TESTING', '2026-06-01', 0.0
from p where slug in ('tp-60xg', 'mol-p60b', 'mol-m65a');
-- Create or Update the 'order_cancelled' email template
INSERT INTO email_templates (key, subject, body_html)
VALUES (
  'order_cancelled',
  'Urgent: Issue with your Zeuz Order',
  '<div style="font-family: sans-serif; color: #111;">
    <h2>Order Refunded</h2>
    <p>Hi there,</p>
    <p>Unfortunately, we had to cancel and refund your recent order.</p>
    <p><strong>Reason:</strong> {{reason}}</p>
    <p>Your payment has been fully refunded to your card (please allow 5-10 days for it to appear).</p>
    <p>If you believe this is a mistake, please reply to this email.</p>
    <br/>
    <p>Zeuz Supply Team</p>
  </div>'
)
ON CONFLICT (key) DO UPDATE 
SET body_html = EXCLUDED.body_html;
