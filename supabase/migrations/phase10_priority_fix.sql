-- Phase 10: Set Product Priorities for Graph Sorting

-- POWER SERIES
UPDATE products SET priority = 1 WHERE name LIKE '%P50B%';
UPDATE products SET priority = 2 WHERE name LIKE '%SAMSUNG%';
UPDATE products SET priority = 3 WHERE name LIKE '%INR-50XG%';

-- ENERGY SERIES
UPDATE products SET priority = 1 WHERE name LIKE '%VAPCELL%' OR name LIKE '%FEB 6250%';
UPDATE products SET priority = 2 WHERE name LIKE '%LG%';
UPDATE products SET priority = 3 WHERE name LIKE '%58HE%';

-- PROTOTYPES (Ensure they are last)
UPDATE products SET priority = 99 WHERE category = 'PROTOTYPE';
