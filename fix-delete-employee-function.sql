-- Drop any existing function with this name in any schema
DROP FUNCTION IF EXISTS delete_employee(INTEGER);
DROP FUNCTION IF EXISTS public.delete_employee(INTEGER);

-- Create the function explicitly in the public schema with a different parameter name
CREATE OR REPLACE FUNCTION public.delete_employee(emp_id INTEGER)
RETURNS VOID AS $$
DECLARE
    trigger_setting TEXT;
BEGIN
    -- Save current trigger setting
    SELECT current_setting('session_replication_role') INTO trigger_setting;
    
    -- Disable triggers temporarily
    SET session_replication_role = 'replica';
    
    -- Delete employee company associations first
    DELETE FROM employee_companies WHERE employee_companies.employee_id = emp_id;

    -- Then delete the employee
    DELETE FROM employees WHERE employees.id = emp_id;
    
    -- Restore trigger setting
    EXECUTE 'SET session_replication_role = ' || quote_literal(trigger_setting);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.delete_employee(INTEGER) TO PUBLIC;
