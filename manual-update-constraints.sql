-- This script can be executed directly in the database if the UI approach doesn't work

-- Drop the existing unique constraint on employee_id and company_id if it exists
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
  -- Check if the total allocation percentage exceeds 100%
  IF (
    SELECT SUM(allocation_percentage)
    FROM employee_companies
    WHERE employee_id = NEW.employee_id
    AND (NEW.id IS NULL OR id != NEW.id) -- Exclude the current record if it's an update
  ) + NEW.allocation_percentage > 100 THEN
    RAISE EXCEPTION 'Total allocation percentage cannot exceed 100%';
  END IF;
  
  -- Check if this specific company-branch combination already exists
  IF EXISTS (
    SELECT 1
    FROM employee_companies
    WHERE employee_id = NEW.employee_id
    AND company_id = NEW.company_id
    AND branch_id = NEW.branch_id
    AND (NEW.id IS NULL OR id != NEW.id) -- Exclude the current record if it's an update
  ) THEN
    RAISE EXCEPTION 'This employee already has an allocation for this company and branch combination';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS validate_employee_company_allocation_trigger ON employee_companies;

CREATE TRIGGER validate_employee_company_allocation_trigger
BEFORE INSERT OR UPDATE ON employee_companies
FOR EACH ROW
EXECUTE FUNCTION validate_employee_company_allocation();
