-- Create quotation workflow history table for Supabase
CREATE TABLE IF NOT EXISTS quotation_workflow_history (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- e.g. 'submitted', 'approved', 'rejected', 'payment_received', 'post_sale_confirmed'
  performed_by UUID NOT NULL,  -- user id
  performed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  comments TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_history_quotation_id ON quotation_workflow_history(quotation_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_performed_by ON quotation_workflow_history(performed_by);
CREATE INDEX IF NOT EXISTS idx_workflow_history_action ON quotation_workflow_history(action);
CREATE INDEX IF NOT EXISTS idx_workflow_history_performed_at ON quotation_workflow_history(performed_at); 