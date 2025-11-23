-- Create automation_rules table
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    trigger JSONB NOT NULL,
    action JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own automation rules"
    ON public.automation_rules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation rules"
    ON public.automation_rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation rules"
    ON public.automation_rules FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation rules"
    ON public.automation_rules FOR DELETE
    USING (auth.uid() = user_id);
