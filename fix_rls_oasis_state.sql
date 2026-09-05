-- ==============================================================================
-- Fix: Enable Row Level Security (RLS) on public.oasis_state
-- This resolves the "RLS Disabled in Public" warning in Supabase Security Advisor
-- ==============================================================================

-- 1. Enable RLS on the table
ALTER TABLE public.oasis_state ENABLE ROW LEVEL SECURITY;

-- 2. Create permissive policies (equivalent to RLS disabled) so the backend 
-- continues to function normally if it relies on the anon key.
-- You can restrict these later if you implement Supabase Auth.
CREATE POLICY "Allow select for all on oasis_state" 
ON public.oasis_state 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert for all on oasis_state" 
ON public.oasis_state 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update for all on oasis_state" 
ON public.oasis_state 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete for all on oasis_state" 
ON public.oasis_state 
FOR DELETE 
USING (true);
