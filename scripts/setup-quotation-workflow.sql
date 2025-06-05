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
  q.id,
  q.client_name,
  q.bride_name,
  q.groom_name,
  q.email,
  q.mobile,
  q.total_amount,
  q.workflow_status,
  q.created_at as quotation_created,
  q.client_verbal_confirmation_date,
  q.payment_received_date,
  q.payment_amount,
  qa.approval_date,
  qa.approver_user_id,
  qa.approval_status,
  psc.confirmation_date,
  psc.confirmed_by_user_id,
  psc.confirmation_method,
  -- Calculate time spent in each stage
  EXTRACT(EPOCH FROM (COALESCE(q.client_verbal_confirmation_date, CURRENT_TIMESTAMP) - q.created_at))/86400 as days_to_client_confirmation,
  EXTRACT(EPOCH FROM (COALESCE(qa.approval_date, CURRENT_TIMESTAMP) - COALESCE(q.client_verbal_confirmation_date, q.created_at)))/86400 as days_to_approval,
  EXTRACT(EPOCH FROM (COALESCE(q.payment_received_date, CURRENT_TIMESTAMP) - COALESCE(qa.approval_date, q.created_at)))/86400 as days_to_payment,
  EXTRACT(EPOCH FROM (COALESCE(psc.confirmation_date, CURRENT_TIMESTAMP) - COALESCE(q.payment_received_date, q.created_at)))/86400 as days_to_confirmation
FROM quotations q
LEFT JOIN quotation_approvals qa ON q.id = qa.quotation_id
LEFT JOIN post_sale_confirmations psc ON q.id = psc.quotation_id;

-- 10. Insert sample workflow statuses for existing quotations (optional migration)
-- Uncomment the line below if you want to set existing quotations to 'pending_client_confirmation'
-- UPDATE quotations SET workflow_status = 'pending_client_confirmation' WHERE workflow_status IS NULL;

COMMENT ON TABLE quotation_approvals IS 'Tracks approval workflow for quotations including Sales Head approvals';
COMMENT ON TABLE post_sale_confirmations IS 'Tracks post-sale confirmation calls and client verification';
COMMENT ON VIEW quotation_workflow_analytics IS 'Analytics view for quotation workflow performance metrics'; 