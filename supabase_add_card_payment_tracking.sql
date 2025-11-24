-- Add payment tracking fields to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS payment_day INTEGER,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
