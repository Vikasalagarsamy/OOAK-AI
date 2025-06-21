-- ============================
-- AI-POWERED TASK MANAGEMENT SYSTEM
-- Automated task creation, smart assignments, reminders, and completion tracking
-- ============================

-- Core Tasks Table
CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'quotation_follow_up', 'quotation_approval', 'lead_follow_up', 
    'payment_follow_up', 'client_meeting', 'document_review', 
    'contract_preparation', 'delivery_coordination', 'general'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  
  -- Assignment Details
  assigned_to_employee_id INTEGER REFERENCES employees(id),
  assigned_by_user_id INTEGER DEFAULT 1, -- AI system assignment
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Related Business Objects
  quotation_id INTEGER REFERENCES quotations(id),
  lead_id UUID,
  client_name TEXT,
  
  -- AI-Generated Metadata
  ai_generated BOOLEAN DEFAULT TRUE,
  ai_confidence_score DECIMAL(3,2) DEFAULT 0.8,
  ai_reasoning TEXT,
  business_impact TEXT CHECK (business_impact IN ('low', 'medium', 'high', 'critical')),
  estimated_value DECIMAL(12,2), -- Potential revenue impact
  
  -- Timing and Deadlines
  due_date TIMESTAMPTZ NOT NULL,
  estimated_duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Completion Details
  completion_notes TEXT,
  actual_duration_minutes INTEGER,
  outcome TEXT CHECK (outcome IN ('successful', 'partial', 'unsuccessful', 'requires_followup')),
  next_action_required BOOLEAN DEFAULT FALSE,
  
  -- Smart Scheduling
  optimal_time_start INTEGER DEFAULT 9, -- 9 AM
  optimal_time_end INTEGER DEFAULT 17,   -- 5 PM
  timezone TEXT DEFAULT 'UTC',
  
  CONSTRAINT valid_ai_confidence CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1)
);

-- Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('blocks', 'follows', 'related')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Task Reminders and Notifications
CREATE TABLE IF NOT EXISTS task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('due_soon', 'overdue', 'escalation', 'completion_reminder')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  notification_channel TEXT NOT NULL CHECK (notification_channel IN ('in_app', 'email', 'whatsapp', 'sms')),
  recipient_employee_id INTEGER REFERENCES employees(id),
  message_template TEXT,
  escalation_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Performance Analytics
CREATE TABLE IF NOT EXISTS task_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  task_type TEXT NOT NULL,
  
  -- Performance Metrics
  total_tasks_assigned INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  total_tasks_overdue INTEGER DEFAULT 0,
  avg_completion_time_minutes DECIMAL(8,2) DEFAULT 0,
  completion_rate DECIMAL(5,4) DEFAULT 0, -- 0.0000 to 1.0000
  
  -- Quality Metrics
  avg_outcome_score DECIMAL(3,2) DEFAULT 0, -- Quality of task completion
  client_satisfaction_impact DECIMAL(3,2) DEFAULT 0,
  revenue_generated DECIMAL(15,2) DEFAULT 0,
  
  -- Time Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, task_type, period_start, period_end)
);

-- AI Task Generation Rules
CREATE TABLE IF NOT EXISTS ai_task_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_description TEXT NOT NULL,
  trigger_condition JSONB NOT NULL, -- Conditions that trigger task creation
  task_template JSONB NOT NULL,     -- Template for generated task
  priority_calculation JSONB,       -- How to calculate priority
  assignment_logic JSONB,           -- How to assign to team members
  
  -- Rule Status
  is_active BOOLEAN DEFAULT TRUE,
  success_rate DECIMAL(5,4) DEFAULT 0,
  tasks_generated INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Comments and Updates
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('update', 'question', 'blocker', 'completion', 'escalation')),
  comment_text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ai_tasks_assigned_to ON ai_tasks(assigned_to_employee_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_priority ON ai_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_due_date ON ai_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_task_type ON ai_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_quotation_id ON ai_tasks(quotation_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_ai_generated ON ai_tasks(ai_generated);

CREATE INDEX IF NOT EXISTS idx_task_reminders_scheduled ON task_reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_task_reminders_sent ON task_reminders(sent_at);
CREATE INDEX IF NOT EXISTS idx_task_reminders_employee ON task_reminders(recipient_employee_id);

CREATE INDEX IF NOT EXISTS idx_task_performance_employee ON task_performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_performance_period ON task_performance(period_start, period_end);

-- RLS Policies
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Users can see tasks assigned to them or created by them
CREATE POLICY "Users can view relevant tasks" ON ai_tasks
  FOR SELECT USING (
    assigned_to_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()::text
    ) OR assigned_by_user_id = auth.uid()::integer
  );

-- Users can update tasks assigned to them
CREATE POLICY "Users can update assigned tasks" ON ai_tasks
  FOR UPDATE USING (
    assigned_to_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()::text
    )
  );

-- System can create tasks for any user (AI automation)
CREATE POLICY "System can create tasks" ON ai_tasks
  FOR INSERT WITH CHECK (true);

-- Users can view their own performance
CREATE POLICY "Users can view own performance" ON task_performance
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()::text
    )
  );

-- Insert Initial AI Task Rules
INSERT INTO ai_task_rules (rule_name, rule_description, trigger_condition, task_template, assignment_logic) VALUES
('quotation_follow_up_rule', 'Create follow-up tasks for sent quotations', 
 '{"quotation_status": "sent", "days_since_sent": 3}',
 '{"title": "Follow up with {client_name} about quotation", "task_type": "quotation_follow_up", "priority": "high", "estimated_duration_minutes": 30}',
 '{"prefer_role": "sales_head", "fallback_department": "SALES"}'
),
('quotation_approval_rule', 'Create approval tasks for draft quotations', 
 '{"quotation_status": "draft", "days_since_created": 1}',
 '{"title": "Review and approve quotation for {client_name}", "task_type": "quotation_approval", "priority": "medium", "estimated_duration_minutes": 15}',
 '{"prefer_role": "sales_manager", "fallback_department": "SALES"}'
),
('payment_follow_up_rule', 'Create payment follow-up tasks for approved quotations', 
 '{"quotation_status": "approved", "days_since_approval": 7, "payment_status": "pending"}',
 '{"title": "Follow up on payment from {client_name}", "task_type": "payment_follow_up", "priority": "high", "estimated_duration_minutes": 20}',
 '{"prefer_role": "sales_head", "fallback_department": "SALES"}'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'AI Task Management System created successfully!';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '- Automated task creation based on business rules';
    RAISE NOTICE '- Smart team member assignment';
    RAISE NOTICE '- Priority calculation and scheduling';
    RAISE NOTICE '- Performance tracking and analytics';
    RAISE NOTICE '- Reminder and notification system';
END $$; 