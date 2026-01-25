-- 1. Add missing columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS nominal_voltage_v numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS charge_voltage_v numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discharge_cutoff_v numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_discharge_a numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS standard_charge_a numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ac_impedance_mohm numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_g numeric;

-- 2. Populate Data (Based on inventory.ts & datasheet values)

-- --- POWER SERIES ---

-- TENPOWER INR-50XG
UPDATE products 
SET 
  nominal_voltage_v = 3.6,
  charge_voltage_v = 4.2,
  discharge_cutoff_v = 2.5,
  standard_charge_a = 2.5,
  max_discharge_a = 40,
  ac_impedance_mohm = 12,
  weight_g = 70
WHERE slug = 'tp-50xg';

-- SAMSUNG 50S
UPDATE products 
SET 
  nominal_voltage_v = 3.6,
  charge_voltage_v = 4.2,
  discharge_cutoff_v = 2.5,
  standard_charge_a = 2.5,
  max_discharge_a = 25,
  ac_impedance_mohm = 14,
  weight_g = 72
WHERE slug = 'sam-50s';

-- MOLICEL P50B
UPDATE products 
SET 
  nominal_voltage_v = 3.6,
  charge_voltage_v = 4.2,
  discharge_cutoff_v = 2.65,
  standard_charge_a = 5.0,
  max_discharge_a = 50,
  ac_impedance_mohm = 8,
  weight_g = 68
WHERE slug = 'mol-p50b';

-- --- ENERGY SERIES ---

-- LG M58T
-- Specs: 5800mAh, 12.5A, 3.6V (Standard M58T Datasheet values)
UPDATE products 
SET 
  nominal_voltage_v = 3.6,
  charge_voltage_v = 4.2,
  discharge_cutoff_v = 2.5,
  standard_charge_a = 1.7, -- Standard charge 0.3C approx
  max_discharge_a = 12.5,
  ac_impedance_mohm = 18,
  weight_g = 70
WHERE slug = 'lg-m58t';

-- TENPOWER 58HE
-- Specs: 5800mAh, 10A (Approx based on class)
UPDATE products 
SET 
  nominal_voltage_v = 3.6,
  charge_voltage_v = 4.2,
  discharge_cutoff_v = 2.5,
  standard_charge_a = 1.7,
  max_discharge_a = 10,
  ac_impedance_mohm = 20,
  weight_g = 70
WHERE slug = 'tp-58he';

-- VAPCELL F63 (FEB 6250)
-- Specs: 6250mAh, 12.5A
UPDATE products 
SET 
  nominal_voltage_v = 3.6,
  charge_voltage_v = 4.2,
  discharge_cutoff_v = 2.5,
  standard_charge_a = 2.0,
  max_discharge_a = 12.5,
  ac_impedance_mohm = 16,
  weight_g = 72
WHERE slug = 'vap-f63';
