-- Create a new function with a different name
CREATE OR REPLACE FUNCTION public.remove_employee(emp_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Delete employee company associations first
    DELETE FROM employee_companies WHERE employee_id = emp_id;
    
    -- Then delete the employee
    DELETE FROM employees WHERE id = emp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.remove_employee(INTEGER) TO PUBLIC;
