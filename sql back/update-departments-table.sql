-- Check if departments table exists and create it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'departments'
  ) THEN
    CREATE TABLE departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END
$$;

-- Check if status column exists and add it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'departments'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE departments ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;
END
$$;

-- Insert departments if they don't exist
INSERT INTO departments (name, description, status)
SELECT 'Engineering', 'Software and hardware engineering department', 'active'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Engineering');

INSERT INTO departments (name, description, status)
SELECT 'Marketing', 'Marketing and advertising department', 'active'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Marketing');

INSERT INTO departments (name, description, status)
SELECT 'Sales', 'Sales and business development department', 'active'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Sales');

INSERT INTO departments (name, description, status)
SELECT 'Human Resources', 'HR and personnel management department', 'active'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Human Resources');

INSERT INTO departments (name, description, status)
SELECT 'Finance', 'Finance and accounting department', 'active'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Finance');
