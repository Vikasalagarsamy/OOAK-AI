-- Function to check if a table exists
CREATE OR REPLACE FUNCTION public.table_exists(tablename TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = tablename
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute SQL statements
CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
