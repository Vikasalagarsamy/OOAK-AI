-- Create a function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  ) INTO exists;
  RETURN exists;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the anon role
GRANT EXECUTE ON FUNCTION table_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION table_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION table_exists(TEXT) TO service_role;
