-- ============================
-- LEAD-TASK INTEGRATION MIGRATION
-- Connect leads with AI task system and add tracking capabilities
-- ============================

-- Add lead_id to existing ai_tasks table for lead-task connection
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL;

-- Add migration tracking to lead_followups (for followup-to-task migration)
ALTER TABLE lead_followups ADD COLUMN IF NOT EXISTS migrated_to_task_id UUID REFERENCES ai_tasks(id) ON DELETE SET NULL;
ALTER TABLE lead_followups ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) DEFAULT 'pending' CHECK (migration_status IN ('pending', 'migrated', 'skipped', 'failed'));
ALTER TABLE lead_followups ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMPTZ;

-- Create task generation log for tracking AI task creation events
CREATE TABLE IF NOT EXISTS task_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
  trigger_event VARCHAR(50) NOT NULL, -- 'lead_assigned', 'lead_qualified', 'quotation_sent', etc.
  business_rule_applied VARCHAR(100) NOT NULL,
  task_id UUID REFERENCES ai_tasks(id) ON DELETE SET NULL,
  employee_assigned_id INTEGER REFERENCES employees(id),
  task_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  estimated_value DECIMAL(12,2),
  sla_hours INTEGER, -- Service Level Agreement in hours
  
  -- Generation metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT TRUE,
  failure_reason TEXT,
  ai_reasoning TEXT,
  
  -- Business context
  department_assigned VARCHAR(50),
  designation_assigned VARCHAR(100),
  lead_status_at_generation VARCHAR(20),
  quotation_status_at_generation VARCHAR(20)
);

-- Create lead task performance tracking
CREATE TABLE IF NOT EXISTS lead_task_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Task metrics
  total_tasks_generated INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  total_tasks_overdue INTEGER DEFAULT 0,
  avg_completion_time_hours DECIMAL(8,2) DEFAULT 0,
  
  -- Business outcomes
  lead_conversion_achieved BOOLEAN DEFAULT FALSE,
  quotation_generated BOOLEAN DEFAULT FALSE,
  deal_closed BOOLEAN DEFAULT FALSE,
  total_revenue_generated DECIMAL(15,2) DEFAULT 0,
  
  -- Timing metrics
  time_to_first_contact_hours DECIMAL(8,2),
  time_to_quotation_hours DECIMAL(8,2),
  time_to_closure_hours DECIMAL(8,2),
  
  -- Quality metrics
  client_satisfaction_score DECIMAL(3,2), -- 1-5 rating
  task_quality_score DECIMAL(3,2), -- Average quality of all tasks
  sla_compliance_rate DECIMAL(5,4), -- 0.0000 to 1.0000
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lead_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_tasks_lead_id ON ai_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_task_generation_log_lead_id ON task_generation_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_task_generation_log_trigger_event ON task_generation_log(trigger_event);
CREATE INDEX IF NOT EXISTS idx_task_generation_log_generated_at ON task_generation_log(generated_at);
CREATE INDEX IF NOT EXISTS idx_lead_followups_migration_status ON lead_followups(migration_status);
CREATE INDEX IF NOT EXISTS idx_lead_task_performance_conversion ON lead_task_performance(lead_conversion_achieved, deal_closed);

-- Create function to automatically update lead task performance
CREATE OR REPLACE FUNCTION update_lead_task_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update performance when task is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.lead_id IS NOT NULL THEN
    INSERT INTO lead_task_performance (lead_id, total_tasks_completed, updated_at)
    VALUES (NEW.lead_id, 1, NOW())
    ON CONFLICT (lead_id) 
    DO UPDATE SET 
      total_tasks_completed = lead_task_performance.total_tasks_completed + 1,
      updated_at = NOW();
  END IF;
  
  -- Update performance when task becomes overdue
  IF NEW.status = 'overdue' AND OLD.status != 'overdue' AND NEW.lead_id IS NOT NULL THEN
    INSERT INTO lead_task_performance (lead_id, total_tasks_overdue, updated_at)
    VALUES (NEW.lead_id, 1, NOW())
    ON CONFLICT (lead_id) 
    DO UPDATE SET 
      total_tasks_overdue = lead_task_performance.total_tasks_overdue + 1,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic performance tracking
DROP TRIGGER IF EXISTS trigger_update_lead_task_performance ON ai_tasks;
CREATE TRIGGER trigger_update_lead_task_performance
  AFTER UPDATE ON ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_task_performance();

-- Create function to log task generation events
CREATE OR REPLACE FUNCTION log_task_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log AI-generated tasks with lead context
  IF NEW.ai_generated = TRUE AND NEW.lead_id IS NOT NULL THEN
    INSERT INTO task_generation_log (
      lead_id,
      quotation_id,
      trigger_event,
      business_rule_applied,
      task_id,
      employee_assigned_id,
      task_type,
      priority,
      estimated_value,
      generated_at,
      success,
      ai_reasoning
    ) VALUES (
      NEW.lead_id,
      NEW.quotation_id,
      COALESCE(NEW.task_type || '_generated', 'task_generated'),
      'ai_business_rule_' || NEW.task_type,
      NEW.id,
      NEW.assigned_to_employee_id,
      NEW.task_type,
      NEW.priority,
      NEW.estimated_value,
      NOW(),
      TRUE,
      NEW.ai_reasoning
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic task generation logging
DROP TRIGGER IF EXISTS trigger_log_task_generation ON ai_tasks;
CREATE TRIGGER trigger_log_task_generation
  AFTER INSERT ON ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_generation();

-- Insert initial task generation rules specific to leads
INSERT INTO ai_task_rules (rule_name, rule_description, trigger_condition, task_template, assignment_logic) VALUES
('lead_assignment_followup', 'Create initial contact task when lead is assigned', 
 '{"lead_status": "ASSIGNED", "days_since_assignment": 0}',
 '{"title": "Initial contact with {client_name}", "task_type": "lead_follow_up", "priority": "medium", "estimated_duration_minutes": 30, "sla_hours": 24}',
 '{"prefer_department": "SALES", "prefer_designation": ["Sales Head", "Sales Resource"], "workload_balancing": true}'
),
('lead_qualification_task', 'Create qualification task for contacted leads', 
 '{"lead_status": "CONTACTED", "days_since_contact": 1}',
 '{"title": "Qualify lead requirements - {client_name}", "task_type": "lead_follow_up", "priority": "medium", "estimated_duration_minutes": 45, "sla_hours": 48}',
 '{"prefer_department": "SALES", "prefer_designation": ["Sales Head", "Senior Sales"], "workload_balancing": false}'
),
('quotation_preparation_task', 'Create quotation preparation task for qualified leads', 
 '{"lead_status": "QUALIFIED", "quotation_not_created": true}',
 '{"title": "Prepare quotation for {client_name}", "task_type": "quotation_approval", "priority": "high", "estimated_duration_minutes": 60, "sla_hours": 48}',
 '{"prefer_department": "SALES", "prefer_designation": ["Sales Head"], "auto_assign_senior": true}'
),
('high_value_lead_escalation', 'Escalate high-value leads to management', 
 '{"lead_estimated_value": ">= 100000", "lead_status": "ASSIGNED", "days_since_assignment": ">= 1"}',
 '{"title": "HIGH VALUE: Manage lead {client_name} (₹{estimated_value})", "task_type": "lead_follow_up", "priority": "urgent", "estimated_duration_minutes": 60, "sla_hours": 12}',
 '{"auto_assign": "Vikas Alagarsamy (SEO)", "prefer_designation": ["Manager", "Sales Head"], "high_priority": true}'
)
ON CONFLICT (rule_name) DO NOTHING;

-- Create view for lead-task analytics
CREATE OR REPLACE VIEW lead_task_analytics AS
SELECT 
  l.id as lead_id,
  l.lead_number,
  l.client_name,
  l.status as lead_status,
  l.estimated_value,
  l.created_at as lead_created_at,
  l.assigned_to,
  
  -- Task metrics
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as overdue_tasks,
  COUNT(CASE WHEN t.priority = 'urgent' THEN 1 END) as urgent_tasks,
  
  -- Performance metrics
  EXTRACT(EPOCH FROM (MIN(t.created_at) - l.created_at))/3600 as hours_to_first_task,
  EXTRACT(EPOCH FROM (MAX(CASE WHEN t.status = 'completed' THEN t.completed_at END) - MIN(t.created_at)))/3600 as task_completion_span_hours,
  
  -- Business outcomes
  CASE WHEN EXISTS(SELECT 1 FROM quotations q WHERE q.lead_id = l.id) THEN TRUE ELSE FALSE END as quotation_created,
  CASE WHEN l.status = 'WON' THEN TRUE ELSE FALSE END as deal_closed,
  
  -- Latest task info
  MAX(t.created_at) as latest_task_created,
  MAX(CASE WHEN t.status = 'completed' THEN t.completed_at END) as latest_task_completed

FROM leads l
LEFT JOIN ai_tasks t ON t.lead_id = l.id
GROUP BY l.id, l.lead_number, l.client_name, l.status, l.estimated_value, l.created_at, l.assigned_to;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Lead-Task Integration Migration Complete:
  • Added lead_id to ai_tasks table
  • Created task_generation_log for tracking
  • Added lead_task_performance metrics
  • Created automated triggers for performance tracking
  • Added lead-specific AI task rules
  • Created analytics view for lead-task insights
  
  🎯 Ready for Lead-Task Integration Service implementation!';
END $$; 