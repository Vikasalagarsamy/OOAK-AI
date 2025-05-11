-- Create a function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean AS $$
DECLARE
  exists boolean;
BEGIN
  SELECT COUNT(*) > 0 INTO exists
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = $1;
  
  RETURN exists;
END;
$$ LANGUAGE plpgsql;

-- Add comment to explain the purpose of the function
COMMENT ON FUNCTION table_exists(text) IS 'Checks if a table exists in the public schema';
