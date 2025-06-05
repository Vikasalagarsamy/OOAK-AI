-- Check if location column exists in employees table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'location'
    ) THEN
        -- Add location column if it doesn't exist
        ALTER TABLE employees ADD COLUMN location VARCHAR(255);
        
        -- Update existing employees with default locations based on branch
        UPDATE employees e
        SET location = b.city
        FROM branches b
        WHERE e.branch_id = b.id AND b.city IS NOT NULL;
        
        -- For employees in Chennai branches, explicitly set location
        UPDATE employees e
        SET location = 'Chennai'
        FROM branches b
        WHERE e.branch_id = b.id AND (
            b.city ILIKE '%chennai%' OR 
            b.name ILIKE '%chennai%' OR 
            b.address ILIKE '%chennai%'
        );
    END IF;
END $$;

-- Verify the column exists and show sample data
SELECT id, first_name, last_name, location 
FROM employees 
WHERE location IS NOT NULL
LIMIT 10;
