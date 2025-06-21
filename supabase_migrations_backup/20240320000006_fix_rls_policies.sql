-- Fix RLS policies for notifications table
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Create simpler, more permissive policies
-- Policy: Users can view notifications where user_id matches (as integer)
CREATE POLICY "Allow users to view own notifications" ON notifications
  FOR SELECT USING (
    user_id = CASE 
      WHEN auth.jwt() ->> 'sub' ~ '^[0-9]+$' THEN (auth.jwt() ->> 'sub')::integer
      ELSE 0
    END
  );

-- Policy: Users can update their own notifications
CREATE POLICY "Allow users to update own notifications" ON notifications
  FOR UPDATE USING (
    user_id = CASE 
      WHEN auth.jwt() ->> 'sub' ~ '^[0-9]+$' THEN (auth.jwt() ->> 'sub')::integer
      ELSE 0
    END
  );

-- Policy: Users can delete their own notifications
CREATE POLICY "Allow users to delete own notifications" ON notifications
  FOR DELETE USING (
    user_id = CASE 
      WHEN auth.jwt() ->> 'sub' ~ '^[0-9]+$' THEN (auth.jwt() ->> 'sub')::integer
      ELSE 0
    END
  );

-- Policy: Allow inserts (for system and API)
CREATE POLICY "Allow notification inserts" ON notifications
  FOR INSERT WITH CHECK (true);

-- Alternative: Temporarily disable RLS for testing (uncomment if needed)
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY; 