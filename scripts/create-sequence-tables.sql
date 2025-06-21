-- Task Sequence Management Tables
-- These tables support the admin dashboard for creating and managing task sequences

-- Main sequence templates table
CREATE TABLE IF NOT EXISTS task_sequence_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'sales_followup',
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(100) DEFAULT 'Admin',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual steps within sequences
CREATE TABLE IF NOT EXISTS sequence_steps (
  id SERIAL PRIMARY KEY,
  sequence_template_id INTEGER REFERENCES task_sequence_templates(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'target',
  due_after_hours INTEGER DEFAULT 24,
  priority VARCHAR(20) DEFAULT 'medium',
  is_conditional BOOLEAN DEFAULT FALSE,
  condition_type VARCHAR(100),
  condition_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conditional rules for sequences
CREATE TABLE IF NOT EXISTS sequence_rules (
  id SERIAL PRIMARY KEY,
  sequence_template_id INTEGER REFERENCES task_sequence_templates(id) ON DELETE CASCADE,
  rule_type VARCHAR(100) NOT NULL, -- 'conditional_step', 'timing_adjustment', 'priority_boost'
  condition_field VARCHAR(100) NOT NULL, -- 'quotation_value', 'client_type', 'response_time'
  condition_operator VARCHAR(20) NOT NULL, -- '>', '<', '=', 'contains', 'not_contains'
  condition_value TEXT NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- 'add_step', 'modify_timing', 'change_priority', 'skip_step'
  action_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sequence_templates_category ON task_sequence_templates(category);
CREATE INDEX IF NOT EXISTS idx_sequence_templates_active ON task_sequence_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_template ON sequence_steps(sequence_template_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_number ON sequence_steps(step_number);
CREATE INDEX IF NOT EXISTS idx_sequence_rules_template ON sequence_rules(sequence_template_id);
CREATE INDEX IF NOT EXISTS idx_sequence_rules_active ON sequence_rules(is_active);

-- Insert some sample sequences
INSERT INTO task_sequence_templates (name, description, category, metadata) VALUES
(
  'Standard Photography Follow-up',
  'Default follow-up sequence for photography quotations',
  'sales_followup',
  '{"total_steps": 5, "estimated_duration_days": 7, "success_rate": 0.65}'
),
(
  'High-Value Client Sequence',
  'Premium follow-up for quotations above ₹1,00,000',
  'premium_followup',
  '{"total_steps": 6, "estimated_duration_days": 5, "success_rate": 0.85}'
);

-- Insert steps for Standard Photography Follow-up
INSERT INTO sequence_steps (sequence_template_id, step_number, title, description, icon, due_after_hours, priority, metadata) VALUES
(1, 1, 'Initial Follow-up Call', 'Call client to confirm quotation receipt and answer initial questions', 'phone', 2, 'high', '{"estimated_duration": "15-20 minutes", "success_criteria": ["Client confirms receipt", "Initial questions answered"]}'),
(1, 2, 'WhatsApp Check-in', 'Send WhatsApp message asking for quotation review status', 'message', 24, 'medium', '{"estimated_duration": "5 minutes", "success_criteria": ["Message delivered", "Client response received"]}'),
(1, 3, 'Detailed Discussion', 'Schedule detailed discussion about services and deliverables', 'target', 72, 'medium', '{"estimated_duration": "30-45 minutes", "success_criteria": ["Meeting scheduled", "Requirements clarified"]}'),
(1, 4, 'Payment Discussion', 'Discuss payment terms and advance payment', 'dollar', 120, 'high', '{"estimated_duration": "20-30 minutes", "success_criteria": ["Payment terms agreed", "Advance discussed"]}'),
(1, 5, 'Final Follow-up', 'Final follow-up to close deal or understand rejection', 'clipboard', 168, 'medium', '{"estimated_duration": "15-20 minutes", "success_criteria": ["Deal closed OR rejection reason understood"]}');

-- Insert steps for High-Value Client Sequence
INSERT INTO sequence_steps (sequence_template_id, step_number, title, description, icon, due_after_hours, priority, metadata) VALUES
(2, 1, 'Priority Call', 'Immediate priority call for high-value client', 'phone', 1, 'high', '{"estimated_duration": "20-30 minutes", "success_criteria": ["Client contacted within 1 hour", "VIP treatment acknowledged"]}'),
(2, 2, 'Team Strategy Meeting', 'Internal team discussion for high-value deal strategy', 'users', 12, 'high', '{"estimated_duration": "30 minutes", "success_criteria": ["Strategy defined", "Team aligned"]}'),
(2, 3, 'Personalized Proposal', 'Create and present personalized proposal', 'target', 24, 'high', '{"estimated_duration": "2 hours", "success_criteria": ["Custom proposal created", "Presentation scheduled"]}'),
(2, 4, 'Executive Meeting', 'Meeting with decision makers and executives', 'users', 48, 'high', '{"estimated_duration": "1 hour", "success_criteria": ["Decision makers met", "Executive buy-in"]}'),
(2, 5, 'Contract Finalization', 'Finalize contract terms and payment', 'dollar', 72, 'high', '{"estimated_duration": "45 minutes", "success_criteria": ["Contract terms finalized", "Payment scheduled"]}'),
(2, 6, 'VIP Onboarding', 'Special onboarding process for high-value client', 'clipboard', 96, 'high', '{"estimated_duration": "1 hour", "success_criteria": ["VIP onboarding completed", "Special services confirmed"]}');

-- Insert some conditional rules
INSERT INTO sequence_rules (sequence_template_id, rule_type, condition_field, condition_operator, condition_value, action_type, action_data) VALUES
(1, 'conditional_step', 'quotation_value', '>', '100000', 'add_step', '{"step_position": 2, "step_data": {"title": "Team Discussion", "description": "Strategic discussion for high-value quotation", "icon": "users", "due_after_hours": 36, "priority": "high"}}'),
(1, 'timing_adjustment', 'client_response_time', '>', '48', 'modify_timing', '{"adjustment_factor": 1.5, "affected_steps": "all"}'),
(2, 'priority_boost', 'quotation_value', '>', '500000', 'change_priority', '{"new_priority": "urgent", "affected_steps": [1, 2, 3]}');

COMMENT ON TABLE task_sequence_templates IS 'Master templates for automated task sequences';
COMMENT ON TABLE sequence_steps IS 'Individual steps within task sequences';
COMMENT ON TABLE sequence_rules IS 'Conditional rules that modify sequence behavior'; 