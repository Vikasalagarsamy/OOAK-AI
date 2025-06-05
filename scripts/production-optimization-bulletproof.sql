-- 🚀 Bulletproof Production Optimization Script
-- Checks for table and column existence before creating indexes

-- Enhanced indexes for notification queries (notifications table should exist)
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

-- Smart index creation with existence checks
DO $$
BEGIN
    -- Quotation system indexes (only if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotations') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_quotations_status_created_at ON quotations(status, created_at DESC)';
        RAISE NOTICE 'Created quotations status index';
        
        -- Check for workflow_status column
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'workflow_status') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_quotations_workflow_status ON quotations(workflow_status) WHERE workflow_status IS NOT NULL';
            RAISE NOTICE 'Created quotations workflow_status index';
        END IF;
        
        -- Check for created_by column
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'created_by') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_quotations_created_by_status ON quotations(created_by, status)';
            RAISE NOTICE 'Created quotations created_by index';
        END IF;
        
        -- Check for total_amount column
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'total_amount') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_quotations_total_amount ON quotations(total_amount) WHERE total_amount > 0';
            RAISE NOTICE 'Created quotations total_amount index';
        END IF;
    END IF;
    
    -- Quotation events indexes (only if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotation_events') THEN
        -- Check for event_date column
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotation_events' AND column_name = 'event_date') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_quotation_events_date ON quotation_events(event_date)';
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_quotation_events_quotation_date ON quotation_events(quotation_id, event_date)';
            RAISE NOTICE 'Created quotation_events indexes';
        END IF;
    END IF;
    
    -- Performance metrics indexes (only if table and columns exist)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales_performance_metrics') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sales_performance_metrics' AND column_name = 'metric_period') 
           AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sales_performance_metrics' AND column_name = 'employee_id') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sales_performance_period_employee ON sales_performance_metrics(metric_period DESC, employee_id)';
            RAISE NOTICE 'Created sales performance period index';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sales_performance_metrics' AND column_name = 'performance_score') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sales_performance_score ON sales_performance_metrics(performance_score DESC) WHERE performance_score IS NOT NULL';
            RAISE NOTICE 'Created sales performance score index';
        END IF;
    END IF;
    
    -- Employee indexes (only if table and columns exist)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role') THEN
            -- Check if is_active column exists
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'is_active') THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_employees_role_active ON employees(role) WHERE is_active = true';
                RAISE NOTICE 'Created employees role_active index';
            ELSE
                -- Create simple role index without is_active condition
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role)';
                RAISE NOTICE 'Created employees role index (no is_active column)';
            END IF;
        END IF;
    END IF;
    
    RAISE NOTICE 'Smart index creation completed!';
END $$;

-- Update table statistics for existing tables
ANALYZE notifications;

-- Analyze other tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotations') THEN
        EXECUTE 'ANALYZE quotations';
        RAISE NOTICE 'Analyzed quotations table';
    END IF;
    
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

SELECT 'Bulletproof optimization complete! All compatible indexes created.' as status; 