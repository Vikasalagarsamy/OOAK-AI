-- Check if the employee_companies table has the necessary columns
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
    END IF;

    -- Add end_date column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'employee_companies' AND column_name = 'end_date') THEN
        ALTER TABLE employee_companies ADD COLUMN end_date DATE;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'employee_companies' AND column_name = 'status') THEN
        ALTER TABLE employee_companies ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
END $$;
