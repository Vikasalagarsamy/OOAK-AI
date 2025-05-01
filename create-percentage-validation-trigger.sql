-- Create a function to validate that employee company percentages sum to exactly 100%
CREATE OR REPLACE FUNCTION validate_employee_company_percentage_exact()
RETURNS TRIGGER AS $$
DECLARE
    total_percentage NUMERIC;
BEGIN
    -- Calculate the total percentage for this employee (excluding the row being deleted if this is a DELETE operation)
    IF TG_OP = 'DELETE' THEN
        SELECT COALESCE(SUM(percentage), 0)
        INTO total_percentage
        FROM employee_companies
        WHERE employee_id = OLD.employee_id AND id != OLD.id;
    ELSE
        -- For INSERT or UPDATE, include the new row in the calculation
        SELECT COALESCE(SUM(percentage), 0)
        INTO total_percentage
        FROM employee_companies
        WHERE employee_id = NEW.employee_id AND id != COALESCE(NEW.id, -1);
        
        -- Add the percentage from the current operation
        total_percentage := total_percentage + COALESCE(NEW.percentage, 100);
    END IF;
    
    -- For DELETE operations, we don't enforce the 100% rule to allow for adjustments
    -- For INSERT and UPDATE, we enforce that the total must be exactly 100%
    IF TG_OP != 'DELETE' AND ABS(total_percentage - 100) > 0.1 THEN
        RAISE EXCEPTION 'Total percentage allocation for employee_id % must be exactly 100%%. Current total: %%', 
            COALESCE(NEW.employee_id, OLD.employee_id), total_percentage;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS validate_employee_company_percentage_trigger ON employee_companies;

-- Create a trigger to enforce the validation
CREATE TRIGGER validate_employee_company_percentage_trigger
AFTER INSERT OR UPDATE OR DELETE ON employee_companies
FOR EACH ROW
EXECUTE FUNCTION validate_employee_company_percentage_exact();
