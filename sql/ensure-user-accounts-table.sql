-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name TEXT) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- Create user_accounts table if it doesn't exist
DO $$
BEGIN
    IF NOT table_exists('user_accounts') THEN
        CREATE TABLE user_accounts (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Add an index on employee_id for faster lookups
        CREATE INDEX idx_user_accounts_employee_id ON user_accounts(employee_id);
        
        -- Add an index on role_id for faster lookups
        CREATE INDEX idx_user_accounts_role_id ON user_accounts(role_id);
        
        RAISE NOTICE 'Created user_accounts table';
    ELSE
        RAISE NOTICE 'user_accounts table already exists';
    END IF;
END $$;
