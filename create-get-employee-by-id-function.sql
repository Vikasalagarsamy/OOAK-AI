-- Create a function to get an employee by ID
-- This provides an alternative way to fetch an employee
CREATE OR REPLACE FUNCTION get_employee_by_id(employee_id integer)
RETURNS json AS $$
DECLARE
  employee_record json;
BEGIN
  SELECT row_to_json(e)
  INTO employee_record
  FROM employees e
  WHERE e.id = employee_id;
  
  RETURN employee_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_employee_by_id(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_by_id(integer) TO service_role;

-- Create a function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean AS $$
DECLARE
  exists_val boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = table_exists.table_name
  ) INTO exists_val;
  
  RETURN exists_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION table_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION table_exists(text) TO service_role;
