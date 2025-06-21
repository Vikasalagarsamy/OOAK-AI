-- Quotation Workflow Database Setup Script
-- This script sets up the enhanced quotation workflow with approval and confirmation tracking

-- 1. Add new columns to existing quotations table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_verbal_confirmation_date TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_received_date TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(12,2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS confirmation_required BOOLEAN DEFAULT true;

-- 2. Create quotation_approvals table
CREATE TABLE IF NOT EXISTS quotation_approvals (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
  approver_user_id UUID REFERENCES users(id),
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending', 
  approval_date TIMESTAMP,
  comments TEXT,
  price_adjustments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected'))
);

-- 3. Create post_sale_confirmations table
CREATE TABLE IF NOT EXISTS post_sale_confirmations (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
  confirmed_by_user_id UUID REFERENCES users(id),
  client_contact_person VARCHAR(100),
  confirmation_date TIMESTAMP,
  deliverables_confirmed JSONB,
  event_details_confirmed JSONB,
  client_expectations TEXT,
  confirmation_method VARCHAR(50) DEFAULT 'phone',
  confirmation_document_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_confirmation_method CHECK (confirmation_method IN ('phone', 'video_call', 'in_person', 'email'))
);

-- 4. Enhance follow-ups table for workflow integration
ALTER TABLE lead_followups ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(50);
ALTER TABLE lead_followups ADD COLUMN IF NOT EXISTS quotation_id INTEGER REFERENCES quotations(id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotations_workflow_status ON quotations(workflow_status);
CREATE INDEX IF NOT EXISTS idx_quotation_approvals_status ON quotation_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_quotation_approvals_quotation_id ON quotation_approvals(quotation_id);
CREATE INDEX IF NOT EXISTS idx_post_sale_confirmations_quotation_id ON post_sale_confirmations(quotation_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_quotation_id ON lead_followups(quotation_id);

-- 6. Create workflow status constraint (with safe execution)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'valid_workflow_status' 
    AND table_name = 'quotations'
  ) THEN
    ALTER TABLE quotations ADD CONSTRAINT valid_workflow_status 
      CHECK (workflow_status IN (
        'draft', 
        'pending_client_confirmation', 
        'pending_approval', 
        'approved', 
        'payment_received', 
        'confirmed', 
        'rejected', 
        'cancelled'
      ));
  END IF;
END $$;

-- 7. Create trigger to automatically update timestamps
CREATE OR REPLACE FUNCTION update_quotation_approval_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_quotation_approval_timestamp'
  ) THEN
    CREATE TRIGGER trigger_update_quotation_approval_timestamp
      BEFORE UPDATE ON quotation_approvals
      FOR EACH ROW
      EXECUTE FUNCTION update_quotation_approval_timestamp();
  END IF;
END $$;

-- 8. Create function to auto-update quotation workflow status based on approvals
CREATE OR REPLACE FUNCTION update_quotation_workflow_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When approval is granted, update quotation status to 'approved'
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    UPDATE quotations 
    SET workflow_status = 'approved'
    WHERE id = NEW.quotation_id;
  END IF;
  
  -- When approval is rejected, update quotation status to 'rejected'
  IF NEW.approval_status = 'rejected' AND OLD.approval_status != 'rejected' THEN
    UPDATE quotations 
    SET workflow_status = 'rejected'
    WHERE id = NEW.quotation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_quotation_workflow_status'
  ) THEN
    CREATE TRIGGER trigger_update_quotation_workflow_status
      AFTER UPDATE ON quotation_approvals
      FOR EACH ROW
      EXECUTE FUNCTION update_quotation_workflow_status();
  END IF;
END $$;

-- 9. Create view for workflow analytics
CREATE OR REPLACE VIEW quotation_workflow_analytics AS
SELECT 
    q.quotation_number,
    q.client_name,
    q.total_amount,
    q.status as quotation_status,
    qa.approval_status,
    qa.created_at as submitted_at,
    qa.approval_date,
    qa.comments,
    EXTRACT(EPOCH FROM (qa.approval_date - qa.created_at))/3600 as approval_time_hours
FROM quotations q
LEFT JOIN quotation_approvals qa ON q.id = qa.quotation_id
ORDER BY q.created_at DESC;

-- 10. Insert sample workflow statuses for existing quotations (optional migration)
-- Uncomment the line below if you want to set existing quotations to 'pending_client_confirmation'
-- UPDATE quotations SET workflow_status = 'pending_client_confirmation' WHERE workflow_status IS NULL;

COMMENT ON TABLE quotation_approvals IS 'Tracks approval workflow for quotations including Sales Head approvals';
COMMENT ON TABLE post_sale_confirmations IS 'Tracks post-sale confirmation calls and client verification';
COMMENT ON VIEW quotation_workflow_analytics IS 'Analytics view for quotation workflow performance metrics';

-- ============================
-- 🔧 DATA SYNCHRONIZATION TRIGGERS
-- ============================

-- Create function to sync quotation updates to related tasks
CREATE OR REPLACE FUNCTION sync_quotation_to_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all tasks linked to this quotation with the new values
    UPDATE ai_tasks 
    SET 
        estimated_value = NEW.total_amount,
        client_name = NEW.client_name,
        updated_at = NOW()
    WHERE quotation_id = NEW.id;
    
    -- Log the sync operation
    INSERT INTO sync_log (table_name, record_id, operation, details)
    VALUES (
        'quotations', 
        NEW.id, 
        'task_sync', 
        format('Synced quotation %s (₹%s) to %s tasks', 
               NEW.quotation_number, 
               NEW.total_amount, 
               (SELECT COUNT(*) FROM ai_tasks WHERE quotation_id = NEW.id)
        )
    ) ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quotation updates
DROP TRIGGER IF EXISTS trigger_sync_quotation_to_tasks ON quotations;
CREATE TRIGGER trigger_sync_quotation_to_tasks
    AFTER UPDATE ON quotations
    FOR EACH ROW
    WHEN (OLD.total_amount IS DISTINCT FROM NEW.total_amount OR OLD.client_name IS DISTINCT FROM NEW.client_name)
    EXECUTE FUNCTION sync_quotation_to_tasks();

-- Create sync log table (if not exists)
CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    operation VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(table_name, record_id, operation, created_at)
);

-- ============================
-- 🎯 ROLE-BASED TASK ASSIGNMENT FUNCTION
-- ============================

-- Create function to ensure proper task assignment
CREATE OR REPLACE FUNCTION ensure_proper_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
    sales_head_id INTEGER;
BEGIN
    -- For quotation approval tasks, ensure they're assigned to Sales Head only
    IF NEW.task_type = 'quotation_approval' THEN
        -- Find Sales Head employee ID
        SELECT id INTO sales_head_id
        FROM employees e
        JOIN roles r ON e.role_id = r.id
        WHERE r.role_name ILIKE '%sales head%'
        LIMIT 1;
        
        IF sales_head_id IS NOT NULL THEN
            NEW.assigned_to_employee_id = sales_head_id;
        ELSE
            -- Log warning if no Sales Head found
            INSERT INTO sync_log (table_name, record_id, operation, details)
            VALUES (
                'ai_tasks', 
                NEW.id, 
                'assignment_warning', 
                'No Sales Head found for quotation approval task assignment'
            ) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task assignment enforcement
DROP TRIGGER IF EXISTS trigger_ensure_proper_task_assignment ON ai_tasks;
CREATE TRIGGER trigger_ensure_proper_task_assignment
    BEFORE INSERT OR UPDATE ON ai_tasks
    FOR EACH ROW
    WHEN (NEW.task_type = 'quotation_approval')
    EXECUTE FUNCTION ensure_proper_task_assignment();

-- ============================
-- 🔄 FIX EXISTING DATA INCONSISTENCIES
-- ============================

-- Sync existing quotation values to related tasks
UPDATE ai_tasks 
SET 
    estimated_value = q.total_amount,
    client_name = q.client_name,
    updated_at = NOW()
FROM quotations q 
WHERE ai_tasks.quotation_id = q.id 
  AND (ai_tasks.estimated_value != q.total_amount OR ai_tasks.client_name != q.client_name);

-- Reassign existing quotation approval tasks to Sales Head
UPDATE ai_tasks 
SET assigned_to_employee_id = (
    SELECT e.id 
    FROM employees e 
    JOIN roles r ON e.role_id = r.id 
    WHERE r.role_name ILIKE '%sales head%' 
    LIMIT 1
)
WHERE task_type = 'quotation_approval' 
  AND assigned_to_employee_id != (
      SELECT e.id 
      FROM employees e 
      JOIN roles r ON e.role_id = r.id 
      WHERE r.role_name ILIKE '%sales head%' 
      LIMIT 1
  );

-- ============================
-- 🎉 SETUP COMPLETE!
-- ============================

SELECT 'Enhanced Quotation Workflow with Data Sync Setup Complete! 🎉' as status; 