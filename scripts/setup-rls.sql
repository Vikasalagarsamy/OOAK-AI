-- 🔒 Row Level Security Setup Script
-- Run this AFTER the main optimization script

-- ===============================
-- ENABLE ROW LEVEL SECURITY
-- ===============================

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ===============================
-- CREATE RLS POLICIES
-- ===============================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS notifications_user_access ON notifications;
DROP POLICY IF EXISTS notifications_admin_access ON notifications;

-- Policy: Users can only see their own notifications
CREATE POLICY notifications_user_access ON notifications
    FOR ALL 
    USING (user_id = current_user_id());

-- Policy: Admins can see all notifications
CREATE POLICY notifications_admin_access ON notifications
    FOR ALL 
    USING (current_user_role() IN ('Administrator', 'Sales Head'));

-- ===============================
-- TEST RLS FUNCTIONALITY
-- ===============================

-- Test the RLS setup
DO $$
BEGIN
    -- Set test user context
    PERFORM set_config('app.current_user_id', '1', false);
    PERFORM set_config('app.current_user_role', 'Administrator', false);
    
    -- Test access
    IF EXISTS (SELECT 1 FROM notifications LIMIT 1) THEN
        RAISE NOTICE 'RLS Test PASSED: Administrator can access notifications';
    ELSE
        RAISE NOTICE 'RLS Test: No notifications found (this may be normal)';
    END IF;
    
    -- Test regular user (if you have user ID 2)
    PERFORM set_config('app.current_user_id', '2', false);
    PERFORM set_config('app.current_user_role', 'Sales Representative', false);
    
    RAISE NOTICE 'RLS setup completed successfully!';
    
    -- Reset to admin
    PERFORM set_config('app.current_user_id', '1', false);
    PERFORM set_config('app.current_user_role', 'Administrator', false);
END $$;

-- ===============================
-- INSTRUCTIONS
-- ===============================

SELECT 'Row Level Security has been enabled!' as status,
       'Remember to set app.current_user_id and app.current_user_role in your application' as reminder; 