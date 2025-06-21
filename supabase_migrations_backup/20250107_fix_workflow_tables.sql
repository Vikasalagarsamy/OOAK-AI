-- 🔧 WORKFLOW TABLES FIX MIGRATION
-- =================================
-- Migration: 20250107_fix_workflow_tables
-- Fixes existing tables and creates missing ones for workflow system

-- 1️⃣ FIX NOTIFICATIONS TABLE (add missing columns if they don't exist)
DO $$ 
BEGIN
    -- Add recipient_role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'recipient_role') THEN
        ALTER TABLE notifications ADD COLUMN recipient_role VARCHAR(50);
    END IF;
    
    -- Add recipient_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'recipient_id') THEN
        ALTER TABLE notifications ADD COLUMN recipient_id INTEGER;
    END IF;
    
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type VARCHAR(50);
    END IF;
    
    -- Add data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE notifications ADD COLUMN data JSONB;
    END IF;
    
    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2️⃣ CREATE AI_TASKS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS ai_tasks (
    id SERIAL PRIMARY KEY,
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
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

-- 3️⃣ CREATE PAYMENTS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('advance', 'partial', 'full')),
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    paid_by VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'received',
    received_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4️⃣ CREATE QUOTATION REVISIONS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS quotation_revisions (
    id SERIAL PRIMARY KEY,
    original_quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    revised_quotation_data JSONB NOT NULL,
    revision_reason TEXT NOT NULL,
    revised_by VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending_approval',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(original_quotation_id, revision_number)
);

-- 5️⃣ CREATE DEPARTMENT INSTRUCTIONS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS department_instructions (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
    instructions JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending_approval',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6️⃣ CREATE INSTRUCTION APPROVALS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS instruction_approvals (
    id SERIAL PRIMARY KEY,
    instruction_id INTEGER REFERENCES department_instructions(id) ON DELETE CASCADE,
    approval_status VARCHAR(20) NOT NULL CHECK (approval_status IN ('submitted', 'approved', 'rejected')),
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    comments TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7️⃣ CREATE ACCOUNTING WORKFLOWS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS accounting_workflows (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
    instruction_id INTEGER REFERENCES department_instructions(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'pending_processing',
    total_amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(20) NOT NULL,
    processed_by VARCHAR(255),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8️⃣ CREATE POST SALES WORKFLOWS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS post_sales_workflows (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
    instruction_id INTEGER REFERENCES department_instructions(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending_confirmation',
    instructions JSONB,
    confirmed_by VARCHAR(255),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔍 CREATE INDEXES FOR PERFORMANCE (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_payments_quotation_id ON payments(quotation_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_quotation_revisions_original_id ON quotation_revisions(original_quotation_id);
CREATE INDEX IF NOT EXISTS idx_department_instructions_quotation_id ON department_instructions(quotation_id);
CREATE INDEX IF NOT EXISTS idx_instruction_approvals_instruction_id ON instruction_approvals(instruction_id);
CREATE INDEX IF NOT EXISTS idx_accounting_workflows_quotation_id ON accounting_workflows(quotation_id);
CREATE INDEX IF NOT EXISTS idx_post_sales_workflows_quotation_id ON post_sales_workflows(quotation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_role, recipient_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_assigned_to ON ai_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_category ON ai_tasks(category);

-- 📊 ADD SAMPLE DATA FOR TESTING (only if payment doesn't exist)
INSERT INTO payments (quotation_id, amount, payment_type, payment_method, payment_reference, paid_by, received_at) 
SELECT 11, 25000.00, 'advance', 'bank_transfer', 'TEST-PAY-001', 'Test Client', NOW()
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE payment_reference = 'TEST-PAY-001');

-- Add sample department instructions
INSERT INTO department_instructions (quotation_id, payment_id, instructions, created_by)
SELECT 
    11,
    p.id,
    '{"event_coordination": "Assign senior coordinator", "photography": "Pre-wedding shoot priority", "catering": "Food tasting session"}',
    'Sales Executive'
FROM payments p 
WHERE p.payment_reference = 'TEST-PAY-001'
AND NOT EXISTS (
    SELECT 1 FROM department_instructions 
    WHERE quotation_id = 11 AND payment_id = p.id
);

-- Enable RLS on new tables only
DO $$
BEGIN
    -- Enable RLS on each table if it exists and RLS is not already enabled
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotation_revisions') THEN
        ALTER TABLE quotation_revisions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'department_instructions') THEN
        ALTER TABLE department_instructions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instruction_approvals') THEN
        ALTER TABLE instruction_approvals ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_workflows') THEN
        ALTER TABLE accounting_workflows ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_sales_workflows') THEN
        ALTER TABLE post_sales_workflows ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_tasks') THEN
        ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for authenticated users (skip if already exist)
DO $$
BEGIN
    -- Create policies only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON payments FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quotation_revisions' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON quotation_revisions FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'department_instructions' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON department_instructions FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'instruction_approvals' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON instruction_approvals FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounting_workflows' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON accounting_workflows FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_sales_workflows' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON post_sales_workflows FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_tasks' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON ai_tasks FOR ALL TO authenticated USING (true);
    END IF;
END $$; 