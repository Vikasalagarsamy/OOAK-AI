-- 🛡️ SAFE WORKFLOW TABLES MIGRATION
-- ===================================
-- Migration: 20250107_safe_workflow_tables
-- Safely creates workflow tables without foreign key violations

-- 1️⃣ FIX NOTIFICATIONS TABLE (add missing columns if they don't exist)
DO $$ 
BEGIN
    -- Add recipient_role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'recipient_role') THEN
        ALTER TABLE notifications ADD COLUMN recipient_role VARCHAR(50);
        RAISE NOTICE 'Added recipient_role column to notifications table';
    ELSE
        RAISE NOTICE 'recipient_role column already exists in notifications table';
    END IF;
    
    -- Add recipient_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'recipient_id') THEN
        ALTER TABLE notifications ADD COLUMN recipient_id INTEGER;
        RAISE NOTICE 'Added recipient_id column to notifications table';
    ELSE
        RAISE NOTICE 'recipient_id column already exists in notifications table';
    END IF;
    
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type VARCHAR(50);
        RAISE NOTICE 'Added type column to notifications table';
    ELSE
        RAISE NOTICE 'type column already exists in notifications table';
    END IF;
    
    -- Add data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE notifications ADD COLUMN data JSONB;
        RAISE NOTICE 'Added data column to notifications table';
    ELSE
        RAISE NOTICE 'data column already exists in notifications table';
    END IF;
    
    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMPTZ;
        RAISE NOTICE 'Added read_at column to notifications table';
    ELSE
        RAISE NOTICE 'read_at column already exists in notifications table';
    END IF;
END $$;

-- 2️⃣ CREATE AI_TASKS TABLE IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_tasks') THEN
        CREATE TABLE ai_tasks (
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
        RAISE NOTICE 'Created ai_tasks table';
    ELSE
        RAISE NOTICE 'ai_tasks table already exists';
    END IF;
END $$;

-- 3️⃣ CREATE PAYMENTS TABLE IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        CREATE TABLE payments (
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
        RAISE NOTICE 'Created payments table';
    ELSE
        RAISE NOTICE 'payments table already exists';
    END IF;
END $$;

-- 4️⃣ CREATE QUOTATION REVISIONS TABLE IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotation_revisions') THEN
        CREATE TABLE quotation_revisions (
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
        RAISE NOTICE 'Created quotation_revisions table';
    ELSE
        RAISE NOTICE 'quotation_revisions table already exists';
    END IF;
END $$;

-- 5️⃣ CREATE DEPARTMENT INSTRUCTIONS TABLE IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'department_instructions') THEN
        CREATE TABLE department_instructions (
            id SERIAL PRIMARY KEY,
            quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
            payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
            instructions JSONB NOT NULL,
            status VARCHAR(20) DEFAULT 'pending_approval',
            created_by VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created department_instructions table';
    ELSE
        RAISE NOTICE 'department_instructions table already exists';
    END IF;
END $$;

-- 6️⃣ CREATE INSTRUCTION APPROVALS TABLE IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instruction_approvals') THEN
        CREATE TABLE instruction_approvals (
            id SERIAL PRIMARY KEY,
            instruction_id INTEGER REFERENCES department_instructions(id) ON DELETE CASCADE,
            approval_status VARCHAR(20) NOT NULL CHECK (approval_status IN ('submitted', 'approved', 'rejected')),
            approved_by VARCHAR(255),
            approved_at TIMESTAMPTZ,
            comments TEXT,
            submitted_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created instruction_approvals table';
    ELSE
        RAISE NOTICE 'instruction_approvals table already exists';
    END IF;
END $$;

-- 7️⃣ CREATE ACCOUNTING WORKFLOWS TABLE IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_workflows') THEN
        CREATE TABLE accounting_workflows (
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
        RAISE NOTICE 'Created accounting_workflows table';
    ELSE
        RAISE NOTICE 'accounting_workflows table already exists';
    END IF;
END $$;

-- 8️⃣ CREATE POST SALES WORKFLOWS TABLE IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_sales_workflows') THEN
        CREATE TABLE post_sales_workflows (
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
        RAISE NOTICE 'Created post_sales_workflows table';
    ELSE
        RAISE NOTICE 'post_sales_workflows table already exists';
    END IF;
END $$;

-- 🔍 CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_payments_quotation_id ON payments(quotation_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_quotation_revisions_original_id ON quotation_revisions(original_quotation_id);
CREATE INDEX IF NOT EXISTS idx_department_instructions_quotation_id ON department_instructions(quotation_id);
CREATE INDEX IF NOT EXISTS idx_instruction_approvals_instruction_id ON instruction_approvals(instruction_id);
CREATE INDEX IF NOT EXISTS idx_accounting_workflows_quotation_id ON accounting_workflows(quotation_id);
CREATE INDEX IF NOT EXISTS idx_post_sales_workflows_quotation_id ON post_sales_workflows(quotation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_role, recipient_id) WHERE recipient_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_assigned_to ON ai_tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_tasks_category ON ai_tasks(category) WHERE category IS NOT NULL;

-- Enable RLS and create policies
DO $$
DECLARE
    table_names TEXT[] := ARRAY['payments', 'quotation_revisions', 'department_instructions', 'instruction_approvals', 'accounting_workflows', 'post_sales_workflows', 'ai_tasks'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        
        -- Create policy if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = table_name 
            AND policyname = 'Allow all operations for authenticated users'
        ) THEN
            EXECUTE format('CREATE POLICY "Allow all operations for authenticated users" ON %I FOR ALL TO authenticated USING (true)', table_name);
            RAISE NOTICE 'Created RLS policy for table: %', table_name;
        ELSE
            RAISE NOTICE 'RLS policy already exists for table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Safe workflow migration completed successfully!';
    RAISE NOTICE 'ℹ️  No test data was inserted to avoid foreign key violations.';
    RAISE NOTICE '🔗 Use the test interface to create sample data with valid quotation IDs.';
END $$; 