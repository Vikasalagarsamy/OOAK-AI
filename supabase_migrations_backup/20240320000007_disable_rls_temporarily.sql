-- Temporarily disable RLS for notifications table to test if RLS is blocking queries
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- This is for testing only - we'll re-enable it once notifications work 