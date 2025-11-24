-- Add reminder_enabled column to loans table
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false;
