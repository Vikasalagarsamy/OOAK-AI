-- Re-enable RLS with proper policies that work
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow users to view own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow users to update own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow users to delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow notification inserts" ON notifications;

-- Create working RLS policies
-- Policy 1: Users can view their own notifications (user_id matches)
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING (
    user_id = COALESCE(
      NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::integer,
      0
    )
  );

-- Policy 2: Users can update their own notifications  
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (
    user_id = COALESCE(
      NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::integer,
      0
    )
  );

-- Policy 3: Users can delete their own notifications
CREATE POLICY "Users delete own notifications" ON notifications
  FOR DELETE USING (
    user_id = COALESCE(
      NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::integer,
      0
    )
  );

-- Policy 4: Allow system/API to insert notifications for any user
CREATE POLICY "System insert notifications" ON notifications
  FOR INSERT WITH CHECK (true); 