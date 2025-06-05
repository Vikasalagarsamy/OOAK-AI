-- Create a function to create the vendors table
CREATE OR REPLACE FUNCTION create_vendors_table()
RETURNS void AS $$
BEGIN
  -- Create the vendors table if it doesn't exist
  CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    vendor_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    website VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'blacklisted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create a trigger to update the updated_at timestamp if it doesn't exist
  -- First, check if the function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_vendor_timestamp'
  ) THEN
    -- Create the function
    EXECUTE '
    CREATE FUNCTION update_vendor_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    ';
  END IF;

  -- Check if the trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_vendor_timestamp'
  ) THEN
    -- Create the trigger
    EXECUTE '
    CREATE TRIGGER update_vendor_timestamp
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_timestamp();
    ';
  END IF;
END;
$$ LANGUAGE plpgsql;
