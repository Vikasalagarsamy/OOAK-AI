-- Add project_id, start_date, end_date, and status columns to employee_companies table
DO $$
BEGIN
    -- Add project_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'employee_companies' AND column_name = 'project_id') THEN
        ALTER TABLE employee_companies ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
    END IF;

    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'employee_companies' AND column_name = 'start_date') THEN
        ALTER TABLE employee_companies ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
        -- Update existing records to have a start date
        UPDATE employee_companies SET start_date = CURRENT_DATE WHERE start_date IS NULL;
    END IF;

    -- Add end_date column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'employee_companies' AND column_name = 'end_date') THEN
        ALTER TABLE employee_companies ADD COLUMN end_date DATE;
    END IF;
END $$;

ALTER TABLE employee_companies 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employee_companies_project_id ON employee_companies(project_id);
CREATE INDEX IF NOT EXISTS idx_employee_companies_status ON employee_companies(status);

-- Update the existing records to have a start date (today)
-- UPDATE employee_companies
-- SET start_date = CURRENT_DATE,
--     status = 'active'
-- WHERE start_date IS NULL;

-- Create a function to get employee allocations with project information
CREATE OR REPLACE FUNCTION get_employee_allocations(p_employee_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  employee_id INTEGER,
  company_id INTEGER,
  company_name VARCHAR,
  branch_id INTEGER,
  branch_name VARCHAR,
  project_id INTEGER,
  project_name VARCHAR,
  allocation_percentage INTEGER,
  is_primary BOOLEAN,
  start_date DATE,
  end_date DATE,
  status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    ec.employee_id,
    ec.company_id,
    c.name AS company_name,
    ec.branch_id,
    b.name AS branch_name,
    ec.project_id,
    p.name AS project_name,
    ec.allocation_percentage,
    ec.is_primary,
    ec.start_date,
    ec.end_date,
    ec.status,
    ec.created_at,
    ec.updated_at
  FROM 
    employee_companies ec
    JOIN companies c ON ec.company_id = c.id
    JOIN branches b ON ec.branch_id = b.id
    LEFT JOIN projects p ON ec.project_id = p.id
  WHERE 
    ec.employee_id = p_employee_id
  ORDER BY 
    ec.is_primary DESC,
    CASE 
      WHEN ec.status = 'active' THEN 1
      WHEN ec.status = 'pending' THEN 2
      ELSE 3
    END,
    ec.start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to validate employee allocation
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
  
  -- Check for overlapping allocations with the same company
  IF EXISTS (
    SELECT 1 FROM employee_companies ec
    WHERE ec.employee_id = NEW.employee_id
      AND ec.company_id = NEW.company_id
      AND ec.id != NEW.id
      AND (
        (NEW.start_date IS NULL) OR
        (ec.end_date IS NULL) OR
        (NEW.start_date <= ec.end_date AND (NEW.end_date IS NULL OR NEW.end_date >= ec.start_date))
      )
  ) THEN
    RAISE EXCEPTION 'Employee already has an overlapping allocation for this company during this period';
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

-- Create trigger for employee allocation validation
DROP TRIGGER IF EXISTS employee_allocation_validation_trigger ON employee_companies;
CREATE TRIGGER employee_allocation_validation_trigger
BEFORE INSERT OR UPDATE ON employee_companies
FOR EACH ROW
EXECUTE FUNCTION validate_employee_allocation();
