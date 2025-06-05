-- Drop any existing function with this name in any schema
DROP FUNCTION IF EXISTS delete_employee(INTEGER);
DROP FUNCTION IF EXISTS public.delete_employee(INTEGER);

-- Create the function explicitly in the public schema with the parameter name emp_id
CREATE OR REPLACE FUNCTION public.delete_employee(emp_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Delete employee company associations first
    DELETE FROM employee_companies WHERE employee_companies.employee_id = emp_id;

    -- Then delete the employee
    DELETE FROM employees WHERE employees.id = emp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.delete_employee(INTEGER) TO PUBLIC;
