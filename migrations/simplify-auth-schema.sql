-- Step 1: Add authentication fields to employees table
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id),
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Migrate existing user accounts to employees
UPDATE employees e
SET 
  username = ua.username,
  password_hash = ua.password_hash,
  role_id = ua.role_id,
  last_login = ua.last_login,
  is_active = ua.is_active
FROM user_accounts ua
WHERE e.id = ua.employee_id;

-- Step 3: Update notifications table
-- First verify if user_id exists and get the column type
DO $$
DECLARE
  user_id_exists boolean;
  user_id_type text;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'user_id'
  ) INTO user_id_exists;

  IF user_id_exists THEN
    -- Add employee_id column if it doesn't exist
    ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id);

    -- Migrate data from user_id to employee_id
    UPDATE notifications n
    SET employee_id = ua.employee_id
    FROM user_accounts ua
    WHERE n.user_id = ua.id
    AND n.employee_id IS NULL;

    -- Drop the user_id column after migration
    ALTER TABLE notifications DROP COLUMN user_id;
  ELSE
    -- If user_id doesn't exist, just add employee_id column
    ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id);
  END IF;
END $$;

-- Step 4: Update tasks assignments
-- First, ensure assigned_to_employee_id exists
ALTER TABLE ai_tasks
  ADD COLUMN IF NOT EXISTS assigned_to_employee_id INTEGER REFERENCES employees(id);

-- Update task assignments using employee names from assigned_to field
UPDATE ai_tasks t
SET assigned_to_employee_id = e.id
FROM employees e
WHERE t.assigned_to = CONCAT(e.first_name, ' ', e.last_name)
  AND t.assigned_to_employee_id IS NULL;

-- Step 5: Drop old tables and views
DROP VIEW IF EXISTS recent_business_notifications CASCADE;
DROP VIEW IF EXISTS user_notification_summary CASCADE;

-- Drop policies
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_user_access" ON notifications;

-- Drop user_accounts table
DROP TABLE IF EXISTS user_accounts CASCADE;

-- Step 6: Create new views and policies
CREATE OR REPLACE VIEW recent_business_notifications AS
SELECT n.*
FROM notifications n
WHERE n.created_at >= NOW() - INTERVAL '30 days';

CREATE OR REPLACE VIEW user_notification_summary AS
SELECT 
  n.employee_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE NOT n.is_read) as unread_notifications
FROM notifications n
GROUP BY n.employee_id;

-- Create new RLS policies
CREATE POLICY "Employees can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    employee_id = (SELECT id FROM employees WHERE username = current_user)
  );

CREATE POLICY "Employees can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    employee_id = (SELECT id FROM employees WHERE username = current_user)
  );

CREATE POLICY "Employees can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (
    employee_id = (SELECT id FROM employees WHERE username = current_user)
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_employee_id ON notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);
CREATE INDEX IF NOT EXISTS idx_employees_role_id ON employees(role_id);