-- Drop the existing table if it exists
DROP TABLE IF EXISTS clients;

-- Create the clients table with company relationship and updated categories
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  client_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  category VARCHAR(20) CHECK (category IN ('BUSINESS', 'INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'NON-PROFIT')) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on company_id for faster lookups
CREATE INDEX idx_clients_company_id ON clients(company_id);

-- Update the create_clients_table function
CREATE OR REPLACE FUNCTION create_clients_table()
RETURNS VOID AS $$
BEGIN
  -- Drop the existing table if it exists
  DROP TABLE IF EXISTS clients;
  
  -- Create the clients table with company relationship
  CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    client_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    category VARCHAR(20) CHECK (category IN ('BUSINESS', 'INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'NON-PROFIT')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Create an index on company_id for faster lookups
  CREATE INDEX idx_clients_company_id ON clients(company_id);
END;
$$ LANGUAGE plpgsql;
