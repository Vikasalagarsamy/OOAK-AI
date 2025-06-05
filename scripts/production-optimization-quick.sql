-- 🚀 Quick Production Optimization Script
-- Uses regular CREATE INDEX (with brief locks) for easier execution
-- Safe for development and small production systems

-- Run the safe script first, then these indexes
-- Enhanced indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at_desc ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority_created ON notifications(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type_user ON notifications(type, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_business ON notifications USING GIN(metadata) WHERE metadata->>'business_event' = 'true';
CREATE INDEX IF NOT EXISTS idx_notifications_composite ON notifications(user_id, is_read, created_at DESC);

-- Quotation system indexes
CREATE INDEX IF NOT EXISTS idx_quotations_status_created_at ON quotations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_workflow_status ON quotations(workflow_status) WHERE workflow_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_created_by_status ON quotations(created_by, status);
CREATE INDEX IF NOT EXISTS idx_quotations_total_amount ON quotations(total_amount) WHERE total_amount > 0;

-- Quotation events indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_quotation_events_date_range ON quotation_events(event_date) WHERE event_date >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_quotation_events_quotation_date ON quotation_events(quotation_id, event_date);

-- Performance metrics indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_sales_performance_period_employee ON sales_performance_metrics(metric_period DESC, employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_performance_score ON sales_performance_metrics(performance_score DESC) WHERE performance_score IS NOT NULL;

-- Employee indexes (if table exists)  
CREATE INDEX IF NOT EXISTS idx_employees_role_active ON employees(role) WHERE is_active = true;

-- Update table statistics
ANALYZE notifications;
ANALYZE quotations;

SELECT 'Quick optimization complete! All indexes created.' as status; 