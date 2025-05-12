-- Create a function to execute SQL and return results
CREATE OR REPLACE FUNCTION exec_sql_with_result(sql text)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql_with_result(text) TO authenticated;
