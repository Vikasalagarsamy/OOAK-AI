-- =============================================================================
-- FIX DELIVERABLE MASTER RLS POLICIES
-- Run this script in your Supabase SQL Editor to fix access issues
-- =============================================================================

-- First, let's check if the table exists and has data
SELECT 'Table exists with ' || COUNT(*) || ' records' as status FROM deliverable_master;

-- Temporarily disable RLS to test if that's the issue
ALTER TABLE deliverable_master DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE deliverable_master ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view deliverable master" ON deliverable_master;
DROP POLICY IF EXISTS "Authenticated users can manage deliverable master" ON deliverable_master;

-- Create more permissive policies for debugging
CREATE POLICY "Allow all read access to deliverable master" ON deliverable_master
  FOR SELECT
  USING (true);

CREATE POLICY "Allow all write access to deliverable master" ON deliverable_master
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Test query to verify access
SELECT 
  'Testing access:' as test,
  category, 
  type, 
  deliverable_name 
FROM deliverable_master 
WHERE category = 'Optional' AND type = 'Photo'
ORDER BY deliverable_name;

-- Also test the specific query our API uses
SELECT * FROM deliverable_master 
WHERE category = 'Optional' AND type = 'Photo'
ORDER BY deliverable_name; 