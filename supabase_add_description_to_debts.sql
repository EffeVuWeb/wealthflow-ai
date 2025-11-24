-- Add description column to debts table
ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS description TEXT;
