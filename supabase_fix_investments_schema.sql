-- Fix investments table columns to match frontend types
ALTER TABLE public.investments 
RENAME COLUMN type TO category;

ALTER TABLE public.investments 
RENAME COLUMN purchase_price TO average_buy_price;
