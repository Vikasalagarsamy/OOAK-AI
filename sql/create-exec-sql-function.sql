-- Function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION exec_sql(sql text) 
RETURNS boolean AS $$
BEGIN
  EXECUTE sql;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error executing SQL: %', SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
