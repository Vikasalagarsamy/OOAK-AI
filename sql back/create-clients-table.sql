CREATE OR REPLACE FUNCTION create_clients_table()
RETURNS void AS $$
BEGIN
  -- Create clients table if it doesn't exist
  CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    category VARCHAR(20) CHECK (category IN ('BUSINESS', 'INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'NON-PROFIT')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Create index on company_id for faster lookups
  CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
  
  -- Create index on client_code for faster lookups
  CREATE INDEX IF NOT EXISTS idx_clients_client_code ON clients(client_code);
  
  -- Create or replace the update timestamp function
  DROP FUNCTION IF EXISTS update_clients_updated_at CASCADE;
  
  EXECUTE 'CREATE OR REPLACE FUNCTION update_clients_updated_at()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql';
  
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS update_clients_updated_at_trigger ON clients;
  
  -- Create the trigger
  CREATE TRIGGER update_clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create the table
SELECT create_clients_table();
