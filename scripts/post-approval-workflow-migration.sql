-- 🔄 Post-Approval Quotation Workflow Database Migration
-- Run this script to add necessary columns and tables for the enhanced workflow

-- ============================
-- 1. ENHANCE QUOTATIONS TABLE
-- ============================

-- Add revision and negotiation tracking columns
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_feedback TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS negotiation_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;

-- Add workflow status if not exists
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'draft';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_workflow_status ON quotations(workflow_status);
CREATE INDEX IF NOT EXISTS idx_quotations_revision_count ON quotations(revision_count);

-- ============================
-- 2. ENHANCE AI_TASKS TABLE
-- ============================

-- Ensure task_type column exists and add index
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_task_type ON ai_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_quotation_status ON ai_tasks(quotation_id, status);

-- ============================
-- 3. ENHANCE NOTIFICATIONS TABLE
-- ============================

-- Ensure notifications table has required columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_user UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================
-- 4. CREATE WORKFLOW ANALYTICS VIEW
-- ============================

CREATE OR REPLACE VIEW quotation_workflow_analytics AS
SELECT 
    q.id,
    q.quotation_number,
    q.client_name,
    q.total_amount,
    q.status,
    q.workflow_status,
    q.revision_count,
    q.created_at as quotation_created,
    q.updated_at as last_updated,
    
    -- Approval information
    qa.approval_status,
    qa.approval_date,
    qa.comments as approval_comments,
    
    -- Task information
    COUNT(CASE WHEN at.task_type = 'quotation_approval' THEN 1 END) as approval_tasks_count,
    COUNT(CASE WHEN at.task_type = 'client_followup' THEN 1 END) as followup_tasks_count,
    COUNT(CASE WHEN at.task_type = 'quotation_revision' THEN 1 END) as revision_tasks_count,
    
    -- Timing metrics
    EXTRACT(EPOCH FROM (qa.approval_date - q.created_at))/3600 as hours_to_approval,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - q.created_at))/24/3600 as days_in_pipeline,
    
    -- Negotiation metrics
    CASE 
        WHEN jsonb_array_length(q.negotiation_history) > 0 
        THEN (q.negotiation_history->0->>'discount_percent')::numeric 
        ELSE 0 
    END as max_discount_percent

FROM quotations q
LEFT JOIN quotation_approvals qa ON q.id = qa.quotation_id
LEFT JOIN ai_tasks at ON q.id = at.quotation_id
GROUP BY q.id, q.quotation_number, q.client_name, q.total_amount, q.status, 
         q.workflow_status, q.revision_count, q.created_at, q.updated_at,
         qa.approval_status, qa.approval_date, qa.comments, q.negotiation_history
ORDER BY q.created_at DESC;

-- ============================
-- 5. CREATE WORKFLOW TRIGGERS
-- ============================

-- Function to update workflow status when approval changes
CREATE OR REPLACE FUNCTION update_quotation_workflow_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- When approval is granted, update quotation workflow status
    IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
        UPDATE quotations 
        SET workflow_status = 'approved',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.quotation_id;
    END IF;
    
    -- When approval is rejected, update quotation workflow status
    IF NEW.approval_status = 'rejected' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'rejected') THEN
        UPDATE quotations 
        SET workflow_status = 'rejected',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.quotation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_quotation_workflow_on_approval'
    ) THEN
        CREATE TRIGGER trigger_update_quotation_workflow_on_approval
            AFTER INSERT OR UPDATE ON quotation_approvals
            FOR EACH ROW
            EXECUTE FUNCTION update_quotation_workflow_on_approval();
    END IF;
END $$;

-- ============================
-- 6. UPDATE EXISTING DATA
-- ============================

-- Set default workflow status for existing quotations
UPDATE quotations 
SET workflow_status = CASE 
    WHEN status = 'approved' THEN 'approved'
    WHEN status = 'rejected' THEN 'rejected'
    WHEN status = 'draft' THEN 'draft'
    ELSE 'pending_approval'
END
WHERE workflow_status IS NULL OR workflow_status = 'draft';

-- Update task types for existing tasks
UPDATE ai_tasks 
SET task_type = 'quotation_approval'
WHERE task_title ILIKE '%review%approval%' 
   OR task_title ILIKE '%approve%quotation%'
   OR task_title ILIKE '%quotation%approval%'
   OR (quotation_id IS NOT NULL AND task_title ILIKE '%review%');

UPDATE ai_tasks 
SET task_type = 'client_followup'
WHERE task_title ILIKE '%follow%up%' 
   AND quotation_id IS NOT NULL;

UPDATE ai_tasks 
SET task_type = 'quotation_revision'
WHERE task_title ILIKE '%revise%quotation%' 
   OR task_title ILIKE '%quotation%rejected%'
   OR task_title ILIKE '%revision%';

-- ============================
-- 7. CREATE PERFORMANCE INDEXES
-- ============================

-- Indexes for faster workflow queries
CREATE INDEX IF NOT EXISTS idx_quotations_workflow_created ON quotations(workflow_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_client_workflow ON quotations(client_name, workflow_status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_workflow_lookup ON ai_tasks(quotation_id, task_type, status);
CREATE INDEX IF NOT EXISTS idx_quotation_approvals_workflow ON quotation_approvals(quotation_id, approval_status, approval_date);

-- ============================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ============================

COMMENT ON COLUMN quotations.revision_notes IS 'Notes about why the quotation was revised';
COMMENT ON COLUMN quotations.client_feedback IS 'Feedback received from client during negotiation';
COMMENT ON COLUMN quotations.negotiation_history IS 'JSON array tracking all price negotiations and revisions';
COMMENT ON COLUMN quotations.revision_count IS 'Number of times this quotation has been revised';
COMMENT ON COLUMN quotations.workflow_status IS 'Current stage in the quotation workflow process';

COMMENT ON VIEW quotation_workflow_analytics IS 'Analytics view for quotation workflow performance metrics';

-- ============================
-- 9. VERIFY MIGRATION
-- ============================

-- Check if all columns were added successfully
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check quotations table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'revision_notes') THEN
        missing_columns := array_append(missing_columns, 'quotations.revision_notes');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'client_feedback') THEN
        missing_columns := array_append(missing_columns, 'quotations.client_feedback');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'negotiation_history') THEN
        missing_columns := array_append(missing_columns, 'quotations.negotiation_history');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'revision_count') THEN
        missing_columns := array_append(missing_columns, 'quotations.revision_count');
    END IF;
    
    -- Report results
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '❌ Migration incomplete. Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Post-Approval Workflow Migration completed successfully!';
        RAISE NOTICE '📊 Analytics view created: quotation_workflow_analytics';
        RAISE NOTICE '🔄 Workflow triggers activated';
        RAISE NOTICE '📈 Performance indexes created';
    END IF;
END $$;

-- ============================
-- 10. SAMPLE QUERIES FOR TESTING
-- ============================

-- Test the analytics view
-- SELECT * FROM quotation_workflow_analytics LIMIT 5;

-- Check workflow status distribution
-- SELECT workflow_status, COUNT(*) as count FROM quotations GROUP BY workflow_status;

-- Check task type distribution
-- SELECT task_type, COUNT(*) as count FROM ai_tasks WHERE quotation_id IS NOT NULL GROUP BY task_type;

SELECT '🎉 Post-Approval Quotation Workflow Migration Complete!' as status; 