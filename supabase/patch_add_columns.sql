-- PATCH: Add missing display columns to PRODUCTS table
-- Run this if you get "column does not exist" errors

alter table products 
add column if not exists spec text,
add column if not exists tag text,
add column if not exists pitch text,
add column if not exists category text check (category in ('POWER', 'ENERGY', 'PROTOTYPE'));
