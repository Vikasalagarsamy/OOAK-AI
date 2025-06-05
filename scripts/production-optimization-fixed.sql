-- 🚀 Fixed Production Optimization Script
-- Removes immutable function issues for Supabase compatibility

-- Enhanced indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at_desc 
ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_priority_created 
ON notifications(priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type_user 
ON notifications(type, user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_metadata_business 
ON notifications USING GIN(metadata) WHERE metadata->>'business_event' = 'true';

CREATE INDEX IF NOT EXISTS idx_notifications_composite 
ON notifications(user_id, is_read, created_at DESC);

-- Quotation system indexes
CREATE INDEX IF NOT EXISTS idx_quotations_status_created_at 
ON quotations(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotations_workflow_status 
ON quotations(workflow_status) WHERE workflow_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_created_by_status 
ON quotations(created_by, status);

CREATE INDEX IF NOT EXISTS idx_quotations_total_amount 
ON quotations(total_amount) WHERE total_amount > 0;

-- Quotation events indexes (FIXED - removed CURRENT_DATE predicate)
CREATE INDEX IF NOT EXISTS idx_quotation_events_date 
ON quotation_events(event_date);

CREATE INDEX IF NOT EXISTS idx_quotation_events_quotation_date 
ON quotation_events(quotation_id, event_date);

-- Performance metrics indexes (if tables exist)
CREATE INDEX IF NOT EXISTS idx_sales_performance_period_employee 
ON sales_performance_metrics(metric_period DESC, employee_id);

CREATE INDEX IF NOT EXISTS idx_sales_performance_score 
ON sales_performance_metrics(performance_score DESC) WHERE performance_score IS NOT NULL;

-- Employee indexes (if table exists)  
CREATE INDEX IF NOT EXISTS idx_employees_role_active 
ON employees(role) WHERE is_active = true;

-- Update table statistics
ANALYZE notifications;

-- Only analyze tables that exist
DO $$
BEGIN
    -- Analyze quotations if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotations') THEN
        EXECUTE 'ANALYZE quotations';
        RAISE NOTICE 'Analyzed quotations table';
    END IF;
    
    -- Analyze other tables if they exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotation_events') THEN
        EXECUTE 'ANALYZE quotation_events';
        RAISE NOTICE 'Analyzed quotation_events table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales_performance_metrics') THEN
        EXECUTE 'ANALYZE sales_performance_metrics';
        RAISE NOTICE 'Analyzed sales_performance_metrics table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        EXECUTE 'ANALYZE employees';
        RAISE NOTICE 'Analyzed employees table';
    END IF;
END $$;

SELECT 'Fixed optimization complete! All compatible indexes created.' as status; 