-- Final AI Tasks Table Fix
-- This script creates a proper ai_tasks table that works with the current codebase

-- Drop existing table if it has schema conflicts
DROP TABLE IF EXISTS ai_tasks CASCADE;

-- Create ai_tasks table with the exact schema that the code expects
CREATE TABLE ai_tasks (
    id SERIAL PRIMARY KEY,
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date TIMESTAMPTZ,
    category VARCHAR(50),
    assigned_to VARCHAR(255),
    assigned_by VARCHAR(255),
    metadata JSONB,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_assigned_to ON ai_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_category ON ai_tasks(category);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_priority ON ai_tasks(priority);

-- Add Row Level Security
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy for now
DROP POLICY IF EXISTS "Allow all access to ai_tasks" ON ai_tasks;
CREATE POLICY "Allow all access to ai_tasks" ON ai_tasks FOR ALL USING (true);

-- Create a trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ai_tasks_updated_at ON ai_tasks;
CREATE TRIGGER update_ai_tasks_updated_at
    BEFORE UPDATE ON ai_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a test record to verify it works
INSERT INTO ai_tasks (task_title, task_description, priority, status, category, assigned_to, assigned_by, metadata)
VALUES (
    'AI Tasks System Test',
    'This is a test task to verify the ai_tasks table is working correctly',
    'medium',
    'pending',
    'system_test',
    'admin',
    'system',
    '{"test": true, "created_by": "schema_fix"}'
);

-- Success message
SELECT 'AI Tasks table has been fixed and is ready for use!' as status,
       COUNT(*) as test_records_count
FROM ai_tasks; 