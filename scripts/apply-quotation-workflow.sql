-- 🎯 Complete Quotation Workflow Database Setup
-- Apply this in your database console to enable the full quotation lifecycle

-- ============================
-- 1. ENHANCE EXISTING QUOTATIONS TABLE
-- ============================

-- Add new columns to existing quotations table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_verbal_confirmation_date TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_received_date TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(12,2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS confirmation_required BOOLEAN DEFAULT true;

-- ============================
-- 2. CREATE QUOTATION APPROVALS TABLE
-- ============================

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

-- ============================
-- 3. CREATE POST-SALE CONFIRMATIONS TABLE
-- ============================

CREATE TABLE IF NOT EXISTS post_sale_confirmations (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  confirmed_by_user_id UUID NOT NULL,
  confirmation_date TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Call Details
  call_date DATE NOT NULL,
  call_time TIME NOT NULL,
  call_duration INTEGER NOT NULL DEFAULT 30, -- minutes
  client_contact_person VARCHAR(255) NOT NULL,
  confirmation_method VARCHAR(50) NOT NULL DEFAULT 'phone', -- phone, video_call, in_person, email
  
  -- Service and Deliverable Confirmations (JSON)
  services_confirmed JSONB DEFAULT '[]',
  deliverables_confirmed JSONB DEFAULT '[]',
  
  -- Event Details Confirmation (JSON)
  event_details_confirmed JSONB DEFAULT '{}',
  
  -- Client Feedback
  client_satisfaction_rating INTEGER DEFAULT 5 CHECK (client_satisfaction_rating BETWEEN 1 AND 5),
  client_expectations TEXT NOT NULL,
  client_concerns TEXT,
  additional_requests TEXT,
  
  -- Documentation
  call_summary TEXT NOT NULL,
  action_items TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  
  -- File Attachments (JSON)
  attachments JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_sale_confirmations_quotation_id ON post_sale_confirmations(quotation_id);
CREATE INDEX IF NOT EXISTS idx_post_sale_confirmations_confirmed_by ON post_sale_confirmations(confirmed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_post_sale_confirmations_call_date ON post_sale_confirmations(call_date);
CREATE INDEX IF NOT EXISTS idx_post_sale_confirmations_follow_up ON post_sale_confirmations(follow_up_required, follow_up_date);

-- ============================
-- 4. ENHANCE FOLLOW-UPS FOR WORKFLOW
-- ============================

ALTER TABLE lead_followups ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(50);
ALTER TABLE lead_followups ADD COLUMN IF NOT EXISTS quotation_id INTEGER REFERENCES quotations(id);

-- ============================
-- 5. CREATE PERFORMANCE INDEXES
-- ============================

CREATE INDEX IF NOT EXISTS idx_quotations_workflow_status ON quotations(workflow_status);
CREATE INDEX IF NOT EXISTS idx_quotation_approvals_status ON quotation_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_quotation_approvals_quotation_id ON quotation_approvals(quotation_id);
CREATE INDEX IF NOT EXISTS idx_post_sale_confirmations_quotation_id ON post_sale_confirmations(quotation_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_quotation_id ON lead_followups(quotation_id);

-- ============================
-- 6. CREATE WORKFLOW STATUS CONSTRAINT
-- ============================

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

-- ============================
-- 7. CREATE AUTO-UPDATE TRIGGERS
-- ============================

-- Function to update approval timestamps
CREATE OR REPLACE FUNCTION update_quotation_approval_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for approval timestamp updates
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

-- Function to auto-update quotation workflow status
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

-- Trigger for workflow status automation
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

-- ============================
-- 8. CREATE ANALYTICS VIEW
-- ============================

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
  -- Calculate time spent in each stage (in days)
  EXTRACT(EPOCH FROM (COALESCE(q.client_verbal_confirmation_date, CURRENT_TIMESTAMP) - q.created_at))/86400 as days_to_client_confirmation,
  EXTRACT(EPOCH FROM (COALESCE(qa.approval_date, CURRENT_TIMESTAMP) - COALESCE(q.client_verbal_confirmation_date, q.created_at)))/86400 as days_to_approval,
  EXTRACT(EPOCH FROM (COALESCE(q.payment_received_date, CURRENT_TIMESTAMP) - COALESCE(qa.approval_date, q.created_at)))/86400 as days_to_payment,
  EXTRACT(EPOCH FROM (COALESCE(psc.confirmation_date, CURRENT_TIMESTAMP) - COALESCE(q.payment_received_date, q.created_at)))/86400 as days_to_confirmation
FROM quotations q
LEFT JOIN quotation_approvals qa ON q.id = qa.quotation_id
LEFT JOIN post_sale_confirmations psc ON q.id = psc.quotation_id;

-- ============================
-- 9. ADD HELPFUL COMMENTS
-- ============================

COMMENT ON TABLE quotation_approvals IS 'Tracks approval workflow for quotations including Sales Head approvals';
COMMENT ON TABLE post_sale_confirmations IS 'Tracks post-sale confirmation calls and client verification';
COMMENT ON VIEW quotation_workflow_analytics IS 'Analytics view for quotation workflow performance metrics';

-- ============================
-- 10. MIGRATE EXISTING DATA (OPTIONAL)
-- ============================

-- Set existing quotations to appropriate workflow status
-- Uncomment these lines if you want to migrate existing data:

-- UPDATE quotations SET workflow_status = 'draft' WHERE status = 'draft' AND workflow_status IS NULL;
-- UPDATE quotations SET workflow_status = 'pending_client_confirmation' WHERE status = 'sent' AND workflow_status IS NULL;
-- UPDATE quotations SET workflow_status = 'approved' WHERE status = 'approved' AND workflow_status IS NULL;
-- UPDATE quotations SET workflow_status = 'rejected' WHERE status = 'rejected' AND workflow_status IS NULL;

-- ============================
-- 🎉 SETUP COMPLETE!
-- ============================

SELECT 'Quotation Workflow Database Setup Complete! 🎉' as status; 