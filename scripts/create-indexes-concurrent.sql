-- 🚀 Concurrent Index Creation Script
-- IMPORTANT: Run each statement INDIVIDUALLY, not as a batch!
-- These cannot run inside transaction blocks

-- ===============================
-- NOTIFICATION SYSTEM INDEXES
-- ===============================

-- Enhanced indexes for notification queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read) WHERE is_read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at_desc 
ON notifications(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_priority_created 
ON notifications(priority, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_user 
ON notifications(type, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_metadata_business 
ON notifications USING GIN(metadata) WHERE metadata->>'business_event' = 'true';

-- Composite index for efficient pagination and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_composite 
ON notifications(user_id, is_read, created_at DESC);

-- ===============================
-- QUOTATION SYSTEM INDEXES
-- ===============================

-- Optimize quotation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_status_created_at 
ON quotations(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_workflow_status 
ON quotations(workflow_status) WHERE workflow_status IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_created_by_status 
ON quotations(created_by, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_total_amount 
ON quotations(total_amount) WHERE total_amount > 0;

-- ===============================
-- QUOTATION EVENTS INDEXES
-- ===============================

-- Optimize quotation events queries (if table exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotation_events_date_range 
ON quotation_events(event_date) WHERE event_date >= CURRENT_DATE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotation_events_quotation_date 
ON quotation_events(quotation_id, event_date);

-- ===============================
-- PERFORMANCE METRICS INDEXES
-- ===============================

-- Optimize sales performance queries (if table exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_performance_period_employee 
ON sales_performance_metrics(metric_period DESC, employee_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_performance_score 
ON sales_performance_metrics(performance_score DESC) WHERE performance_score IS NOT NULL;

-- ===============================
-- EMPLOYEE INDEXES
-- ===============================

-- Optimize employee queries (if table exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_role_active 
ON employees(role) WHERE is_active = true; 