-- Function to execute arbitrary SQL statements
CREATE OR REPLACE FUNCTION execute_sql(sql_statement text) 
RETURNS boolean AS $$
BEGIN
  EXECUTE sql_statement;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error executing SQL: %', SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
