-- Function to execute SQL without returning results
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute SQL and return results
CREATE OR REPLACE FUNCTION exec_sql_with_result(sql_query TEXT)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
