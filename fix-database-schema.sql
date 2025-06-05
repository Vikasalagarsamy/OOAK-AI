-- Fix Database Schema for AI Task Integration
-- This script creates the missing tables and columns needed for the integration to work

-- 1. Create AI Tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_tasks (
    id SERIAL PRIMARY KEY,
    task_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    assigned_to INTEGER,
    created_by INTEGER,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    company_id INTEGER DEFAULT 1,
    branch_id INTEGER DEFAULT 1,
    category VARCHAR(50) DEFAULT 'GENERAL',
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    business_impact VARCHAR(50),
    automation_source VARCHAR(100),
    lead_id INTEGER, -- Connection to leads
    quotation_id INTEGER, -- Connection to quotations
    tags TEXT[],
    metadata JSONB
);

-- 2. Add name column to employees table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employees' AND column_name = 'name') THEN
        ALTER TABLE employees ADD COLUMN name VARCHAR(255);
        
        -- Update existing employees with a computed name (fixed to not use username)
        UPDATE employees 
        SET name = COALESCE(
            CASE 
                WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
                THEN first_name || ' ' || last_name
                WHEN first_name IS NOT NULL 
                THEN first_name
                WHEN last_name IS NOT NULL 
                THEN last_name
                ELSE 'Employee #' || id::text
            END
        )
        WHERE name IS NULL;
    END IF;
END $$;

-- 3. Create task generation log table
CREATE TABLE IF NOT EXISTS public.task_generation_log (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER,
    quotation_id INTEGER,
    rule_triggered VARCHAR(100) NOT NULL,
    task_id INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    triggered_by VARCHAR(100),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 4. Create lead task performance table
CREATE TABLE IF NOT EXISTS public.lead_task_performance (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    response_time_hours DECIMAL(10,2),
    completion_time_hours DECIMAL(10,2),
    sla_met BOOLEAN,
    revenue_impact DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lead_id, task_id)
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_tasks_assigned_to ON ai_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_lead_id ON ai_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_due_date ON ai_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_generation_log_lead_id ON task_generation_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_task_performance_lead_id ON lead_task_performance(lead_id);

-- 6. Add Row Level Security (RLS) policies
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_generation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_task_performance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow all access to ai_tasks" ON ai_tasks;
DROP POLICY IF EXISTS "Allow all access to task_generation_log" ON task_generation_log;
DROP POLICY IF EXISTS "Allow all access to lead_task_performance" ON lead_task_performance;

-- Create RLS policies (without IF NOT EXISTS)
CREATE POLICY "Allow all access to ai_tasks" ON ai_tasks FOR ALL USING (true);
CREATE POLICY "Allow all access to task_generation_log" ON task_generation_log FOR ALL USING (true);
CREATE POLICY "Allow all access to lead_task_performance" ON lead_task_performance FOR ALL USING (true);

-- 7. Create a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to ai_tasks table
DROP TRIGGER IF EXISTS update_ai_tasks_updated_at ON ai_tasks;
CREATE TRIGGER update_ai_tasks_updated_at
    BEFORE UPDATE ON ai_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert some sample data for testing
INSERT INTO ai_tasks (task_number, title, description, priority, status, assigned_to, created_by, company_id, branch_id, category)
VALUES 
('TASK-SAMPLE-001', 'Sample AI Task', 'This is a sample task for testing', 'MEDIUM', 'PENDING', 1, 1, 1, 1, 'SAMPLE')
ON CONFLICT (task_number) DO NOTHING;

-- Display success message
SELECT 'Database schema fixed successfully! AI Tasks integration is now ready.' as status; 