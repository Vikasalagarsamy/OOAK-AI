-- Check if user_accounts table exists and create it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_accounts'
  ) THEN
    -- Create the user_accounts table
    CREATE TABLE user_accounts (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END
$$;

-- Now ensure the foreign key constraints exist
DO $$
BEGIN
  -- Check if the employee_id foreign key constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_accounts_employee_id_fkey'
    AND table_name = 'user_accounts'
  ) THEN
    -- Add the constraint if it doesn't exist
    ALTER TABLE user_accounts
    ADD CONSTRAINT user_accounts_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  -- Check if the role_id foreign key constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_accounts_role_id_fkey'
    AND table_name = 'user_accounts'
  ) THEN
    -- Add the constraint if it doesn't exist
    ALTER TABLE user_accounts
    ADD CONSTRAINT user_accounts_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES roles(id);
  END IF;
END
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_employee_id ON user_accounts(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_role_id ON user_accounts(role_id);
