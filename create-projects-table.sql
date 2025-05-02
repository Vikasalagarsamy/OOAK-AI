-- Check if the projects table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        -- Create the projects table
        CREATE TABLE projects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            code VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            start_date DATE,
            end_date DATE,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Add index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
        CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

        -- Add some sample projects
        INSERT INTO projects (name, code, description, start_date, end_date, status, company_id)
        VALUES
          ('Website Redesign', 'PRJ-001', 'Complete overhaul of company website', '2023-01-01', '2023-12-31', 'active', 1),
          ('Mobile App Development', 'PRJ-002', 'Develop new mobile application for customers', '2023-03-15', '2023-09-30', 'active', 1),
          ('ERP Implementation', 'PRJ-003', 'Implement new enterprise resource planning system', '2023-02-01', '2024-01-31', 'active', 2),
          ('Office Relocation', 'PRJ-004', 'Coordinate office move to new headquarters', '2023-06-01', '2023-08-31', 'active', 2),
          ('Marketing Campaign', 'PRJ-005', 'Q4 marketing campaign for new product line', '2023-10-01', '2023-12-15', 'pending', 3);

        INSERT INTO projects (name, description, company_id, start_date, end_date, status, code)
        SELECT 
            'General Operations', 
            'Day-to-day operations and general work', 
            id, 
            CURRENT_DATE - INTERVAL '1 month', 
            NULL, 
            'active',
            'GEN-' || id::text
        FROM companies;

        -- Create a function to check if a project exists
        CREATE OR REPLACE FUNCTION project_exists(p_project_id INTEGER)
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (SELECT 1 FROM projects WHERE id = p_project_id);
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;
