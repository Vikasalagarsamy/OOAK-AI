-- Create a function to set the primary company in a transaction
CREATE OR REPLACE FUNCTION set_primary_company(company_assoc_id INT, emp_id INT)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Start transaction
  BEGIN
    -- First, set all associations to not primary
    UPDATE employee_companies 
    SET is_primary = FALSE 
    WHERE employee_id = emp_id;
    
    -- Then set the selected one as primary
    UPDATE employee_companies 
    SET is_primary = TRUE 
    WHERE id = company_assoc_id;
    
    -- Check if the update was successful
    IF EXISTS (SELECT 1 FROM employee_companies WHERE id = company_assoc_id AND is_primary = TRUE) THEN
      success := TRUE;
    ELSE
      success := FALSE;
      RAISE EXCEPTION 'Failed to set primary company';
    END IF;
    
    RETURN success;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error in set_primary_company: %', SQLERRM;
      RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql;
