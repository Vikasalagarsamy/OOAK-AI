-- Drop the existing constraint that prevents same company multiple times
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_companies_employee_id_company_id_key' 
        AND table_name = 'employee_companies'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        ALTER TABLE employee_companies 
        DROP CONSTRAINT employee_companies_employee_id_company_id_key;
        
        -- Add a new constraint that includes both company_id and branch_id
        -- This ensures an employee can't be allocated to the same company-branch combination twice
        ALTER TABLE employee_companies 
        ADD CONSTRAINT employee_companies_employee_id_company_id_branch_id_key 
        UNIQUE (employee_id, company_id, branch_id);
    END IF;
END $$;

-- Update the validation function to allow same company with different branches
CREATE OR REPLACE FUNCTION validate_employee_allocation()
RETURNS TRIGGER AS $$
DECLARE
  total_allocation INTEGER;
  active_allocations INTEGER;
BEGIN
  -- Check if dates are valid
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL AND NEW.start_date > NEW.end_date THEN
    RAISE EXCEPTION 'End date cannot be before start date';
  END IF;
  
  -- Set status based on dates
  IF NEW.start_date IS NOT NULL AND NEW.start_date > CURRENT_DATE THEN
    NEW.status := 'pending';
  ELSIF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSE
    NEW.status := 'active';
  END IF;
  
  -- Check for overlapping allocations with the same company AND branch
  -- Modified to check for specific company-branch combination instead of just company
  IF EXISTS (
    SELECT 1 FROM employee_companies ec
    WHERE ec.employee_id = NEW.employee_id
      AND ec.company_id = NEW.company_id
      AND ec.branch_id = NEW.branch_id
      AND ec.id != NEW.id
      AND (
        (NEW.start_date IS NULL) OR
        (ec.end_date IS NULL) OR
        (NEW.start_date <= ec.end_date AND (NEW.end_date IS NULL OR NEW.end_date >= ec.start_date))
      )
  ) THEN
    RAISE EXCEPTION 'Employee already has an allocation for this company and branch during this period';
  END IF;
  
  -- Calculate total allocation for active allocations
  SELECT COALESCE(SUM(allocation_percentage), 0)
  INTO total_allocation
  FROM employee_companies
  WHERE employee_id = NEW.employee_id
    AND id != NEW.id
    AND (status = 'active' OR status = 'pending');
  
  -- Check if total allocation exceeds 100%
  IF (total_allocation + NEW.allocation_percentage) > 100 AND (NEW.status = 'active' OR NEW.status = 'pending') THEN
    RAISE EXCEPTION 'Total allocation percentage cannot exceed 100%%. Current total: %%%, Adding: %%%', 
      total_allocation, NEW.allocation_percentage;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
