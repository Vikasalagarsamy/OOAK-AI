-- Check if the user_accounts table exists
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
    
    -- Add indexes
    CREATE INDEX idx_user_accounts_employee_id ON user_accounts(employee_id);
    CREATE INDEX idx_user_accounts_role_id ON user_accounts(role_id);
  END IF;
END
$$;

-- Check if the auth_logs table exists and create it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'auth_logs'
  ) THEN
    -- Create the auth_logs table
    CREATE TABLE auth_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      action VARCHAR(50) NOT NULL,
      ip_address VARCHAR(50),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add index
    CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
  END IF;
END
$$;

-- Check and fix foreign key constraints
DO $$
BEGIN
  -- Check if the employee_id foreign key constraint exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_accounts_employee_id_fkey'
    AND table_name = 'user_accounts'
  ) THEN
    -- Drop the constraint if it exists
    ALTER TABLE user_accounts DROP CONSTRAINT user_accounts_employee_id_fkey;
  END IF;

  -- Check if the role_id foreign key constraint exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_accounts_role_id_fkey'
    AND table_name = 'user_accounts'
  ) THEN
    -- Drop the constraint if it exists
    ALTER TABLE user_accounts DROP CONSTRAINT user_accounts_role_id_fkey;
  END IF;
  
  -- Add the constraints back with ON DELETE CASCADE
  ALTER TABLE user_accounts
  ADD CONSTRAINT user_accounts_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  
  ALTER TABLE user_accounts
  ADD CONSTRAINT user_accounts_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
  
  -- Check if auth_logs has a foreign key constraint to user_accounts
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'auth_logs_user_id_fkey'
    AND table_name = 'auth_logs'
  ) THEN
    -- Drop the constraint if it exists
    ALTER TABLE auth_logs DROP CONSTRAINT auth_logs_user_id_fkey;
  END IF;
  
  -- Add the constraint back with ON DELETE CASCADE
  ALTER TABLE auth_logs
  ADD CONSTRAINT auth_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE;
END
$$;
