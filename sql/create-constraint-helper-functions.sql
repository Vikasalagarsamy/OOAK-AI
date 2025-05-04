-- Function to drop a constraint from a table
CREATE OR REPLACE FUNCTION alter_table_drop_constraint(
  table_name text,
  constraint_name text
) RETURNS boolean AS $$
DECLARE
  sql_statement text;
BEGIN
  sql_statement := 'ALTER TABLE ' || quote_ident(table_name) || 
                   ' DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
  EXECUTE sql_statement;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a unique constraint to a table
CREATE OR REPLACE FUNCTION alter_table_add_unique_constraint(
  table_name text,
  constraint_name text,
  column_names text[]
) RETURNS boolean AS $$
DECLARE
  sql_statement text;
  column_list text;
BEGIN
  -- Convert array of column names to comma-separated list
  SELECT string_agg(quote_ident(col), ', ') INTO column_list FROM unnest(column_names) AS col;
  
  sql_statement := 'ALTER TABLE ' || quote_ident(table_name) || 
                   ' ADD CONSTRAINT ' || quote_ident(constraint_name) || 
                   ' UNIQUE (' || column_list || ')';
  EXECUTE sql_statement;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error adding constraint: %', SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a constraint exists
CREATE OR REPLACE FUNCTION constraint_exists(
  table_name text,
  constraint_name text
) RETURNS boolean AS $$
DECLARE
  exists_check boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = constraint_name
    AND table_name = table_name
  ) INTO exists_check;
  
  RETURN exists_check;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error checking constraint: %', SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
