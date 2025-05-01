-- Create a function to delete multiple employees at once
CREATE OR REPLACE FUNCTION batch_delete_employees(employee_ids TEXT[])
RETURNS TABLE(
  deleted_id TEXT,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  employee_id TEXT;
  result RECORD;
BEGIN
  -- For each employee ID in the array
  FOREACH employee_id IN ARRAY employee_ids
  LOOP
    BEGIN
      -- First try to use the remove_employee function if it exists
      IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'remove_employee' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ) THEN
        -- Call the existing remove_employee function
        PERFORM remove_employee(employee_id::uuid);
        
        -- Return success
        deleted_id := employee_id;
        success := TRUE;
        error_message := NULL;
        RETURN NEXT;
      ELSE
        -- Directly delete the employee if the function doesn't exist
        DELETE FROM employees WHERE id = employee_id::uuid RETURNING id INTO result;
        
        IF result IS NULL THEN
          RAISE EXCEPTION 'Employee with ID % not found', employee_id;
        END IF;
        
        -- Return success
        deleted_id := employee_id;
        success := TRUE;
        error_message := NULL;
        RETURN NEXT;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Return failure with error message
      deleted_id := employee_id;
      success := FALSE;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
