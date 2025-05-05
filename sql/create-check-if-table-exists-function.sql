-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_if_table_exists(table_name_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_name_param
  );
END;
$$ LANGUAGE plpgsql;
