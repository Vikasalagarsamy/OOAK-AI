-- Add account-related columns to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS username VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id),
ADD COLUMN IF NOT EXISTS account_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS account_updated_at TIMESTAMPTZ;

-- Add unique constraint on username
ALTER TABLE employees
ADD CONSTRAINT employees_username_unique UNIQUE (username);

-- Add index on role_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_role_id ON employees(role_id); 