-- Add payment_account_id to loans table
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
