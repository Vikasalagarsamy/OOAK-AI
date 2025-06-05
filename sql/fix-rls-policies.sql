-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can insert their own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can update their own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can delete their own quotations" ON quotations;

DROP POLICY IF EXISTS "Users can view events for their quotations" ON quotation_events;
DROP POLICY IF EXISTS "Users can insert events for their quotations" ON quotation_events;
DROP POLICY IF EXISTS "Users can update events for their quotations" ON quotation_events;
DROP POLICY IF EXISTS "Users can delete events for their quotations" ON quotation_events;

-- Create more flexible policies that work with mock auth
-- Allow access for mock user or real authenticated users
CREATE POLICY "Allow quotation access" ON quotations
  FOR ALL USING (
    created_by = '00000000-0000-0000-0000-000000000000'::text OR 
    auth.uid()::text = created_by::text
  );

CREATE POLICY "Allow quotation events access" ON quotation_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_events.quotation_id 
      AND (
        quotations.created_by = '00000000-0000-0000-0000-000000000000'::text OR
        quotations.created_by::text = auth.uid()::text
      )
    )
  );

-- Alternative: If you want to completely disable RLS for development
-- Uncomment the lines below:
-- ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE quotation_events DISABLE ROW LEVEL SECURITY; 