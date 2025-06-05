-- Drop any existing function with this name in any schema
DROP FUNCTION IF EXISTS delete_employee(INTEGER);
DROP FUNCTION IF EXISTS public.delete_employee(INTEGER);

-- Create a simpler function with a very distinct parameter name
CREATE OR REPLACE FUNCTION public.delete_employee(employee_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Delete employee company associations first
    DELETE FROM employee_companies WHERE employee_id = employee_id_param;

    -- Then delete the employee
    DELETE FROM employees WHERE id = employee_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.delete_employee(INTEGER) TO PUBLIC;
