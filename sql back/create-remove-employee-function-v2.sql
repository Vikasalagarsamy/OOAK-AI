-- Create a new function that explicitly disables triggers
CREATE OR REPLACE FUNCTION public.remove_employee_v2(emp_id INTEGER)
RETURNS VOID AS $$
DECLARE
    trigger_setting TEXT;
BEGIN
    -- Save current trigger setting
    SELECT current_setting('session_replication_role') INTO trigger_setting;
    
    -- Disable triggers temporarily
    SET session_replication_role = 'replica';
    
    BEGIN
        -- Delete employee company associations first
        DELETE FROM employee_companies WHERE employee_id = emp_id;
        
        -- Then delete the employee
        DELETE FROM employees WHERE id = emp_id;
        
        -- Restore original trigger setting
        EXECUTE 'SET session_replication_role = ' || quote_literal(trigger_setting);
    EXCEPTION
        WHEN OTHERS THEN
            -- Ensure triggers are re-enabled even if an error occurs
            EXECUTE 'SET session_replication_role = ' || quote_literal(trigger_setting);
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.remove_employee_v2(INTEGER) TO PUBLIC;
