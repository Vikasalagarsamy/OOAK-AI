-- Check if departments table exists and has data
DO $$
DECLARE
  department_count INTEGER;
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departments') THEN
    -- Count departments
    SELECT COUNT(*) INTO department_count FROM departments;
    
    -- If no departments exist, add some sample departments
    IF department_count = 0 THEN
      INSERT INTO departments (name, description, status)
      VALUES 
        ('Engineering', 'Software development and engineering team', 'active'),
        ('Marketing', 'Marketing and communications team', 'active'),
        ('Sales', 'Sales and business development team', 'active'),
        ('Human Resources', 'HR and people operations team', 'active'),
        ('Finance', 'Finance and accounting team', 'active'),
        ('Operations', 'Operations and administration team', 'active');
        
      RAISE NOTICE 'Added 6 sample departments';
    ELSE
      RAISE NOTICE 'Found % existing departments', department_count;
    END IF;
  ELSE
    RAISE NOTICE 'Departments table does not exist';
  END IF;
END
$$;

-- Display all departments
SELECT id, name, description, status FROM departments ORDER BY name;
