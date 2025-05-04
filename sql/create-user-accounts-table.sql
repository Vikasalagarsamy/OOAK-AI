-- Check if user_accounts table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_accounts'
  ) THEN
    -- Create user_accounts table
    CREATE TABLE user_accounts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      role_id UUID NOT NULL REFERENCES roles(id),
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add indexes for performance
    CREATE INDEX idx_user_accounts_employee_id ON user_accounts(employee_id);
    CREATE INDEX idx_user_accounts_role_id ON user_accounts(role_id);
    CREATE INDEX idx_user_accounts_email ON user_accounts(email);
    CREATE INDEX idx_user_accounts_username ON user_accounts(username);
    
    -- Add trigger to update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_user_accounts_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_user_accounts_updated_at
    BEFORE UPDATE ON user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_accounts_updated_at();
  END IF;
END
$$;
