-- Drop the existing unique constraint on employee_id and company_id
ALTER TABLE employee_companies 
DROP CONSTRAINT IF EXISTS employee_companies_employee_id_company_id_key;

-- Add a new unique constraint that includes branch_id
ALTER TABLE employee_companies 
ADD CONSTRAINT employee_companies_employee_id_company_id_branch_id_key 
UNIQUE (employee_id, company_id, branch_id);

-- Update the validation trigger function to check for company-branch combinations
CREATE OR REPLACE FUNCTION validate_employee_company_allocation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if total allocation would exceed 100%
  IF (
    SELECT SUM(allocation_percentage)
    FROM employee_companies
    WHERE employee_id = NEW.employee_id
    AND (id != NEW.id OR NEW.id IS NULL)
  ) + NEW.allocation_percentage > 100 THEN
    RAISE EXCEPTION 'Total allocation percentage cannot exceed 100%';
  END IF;
  
  -- Check if this company-branch combination already exists for this employee
  IF EXISTS (
    SELECT 1
    FROM employee_companies
    WHERE employee_id = NEW.employee_id
    AND company_id = NEW.company_id
    AND branch_id = NEW.branch_id
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'This company-branch combination already exists for this employee';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'validate_employee_company_allocation_trigger'
  ) THEN
    CREATE TRIGGER validate_employee_company_allocation_trigger
    BEFORE INSERT OR UPDATE ON employee_companies
    FOR EACH ROW
    EXECUTE FUNCTION validate_employee_company_allocation();
  END IF;
END;
$$;
