-- 🗄️ COMPLETE WORKFLOW DATABASE SCHEMA MIGRATION
-- ================================================
-- Migration: 20250107_create_workflow_tables
-- Creates all missing tables for the business workflow system

-- 1️⃣ PAYMENTS TABLE
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

-- 2️⃣ QUOTATION REVISIONS TABLE
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

-- 3️⃣ DEPARTMENT INSTRUCTIONS TABLE
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

-- 4️⃣ INSTRUCTION APPROVALS TABLE
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

-- 5️⃣ ACCOUNTING WORKFLOWS TABLE
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

-- 6️⃣ POST SALES WORKFLOWS TABLE
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

-- 7️⃣ NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_role VARCHAR(50) NOT NULL,
    recipient_id INTEGER,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8️⃣ AI TASKS TABLE
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

-- 🔍 CREATE INDEXES FOR PERFORMANCE
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

-- 📊 ADD SAMPLE DATA FOR TESTING
INSERT INTO payments (quotation_id, amount, payment_type, payment_method, payment_reference, paid_by, received_at) 
VALUES (11, 25000.00, 'advance', 'bank_transfer', 'TEST-PAY-001', 'Test Client', NOW())
ON CONFLICT (payment_reference) DO NOTHING;

-- Get the payment ID for the instruction insert
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

-- Row Level Security (RLS) Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruction_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_sales_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON quotation_revisions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON department_instructions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON instruction_approvals FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON accounting_workflows FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON post_sales_workflows FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON notifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON ai_tasks FOR ALL TO authenticated USING (true); 