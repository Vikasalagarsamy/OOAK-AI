-- Create a function to get table columns
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS text[] AS $$
DECLARE
  columns text[];
BEGIN
  SELECT array_agg(column_name::text)
  INTO columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = $1;
  
  RETURN columns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
