-- 🚀 Production Optimization Script
-- This script optimizes the database for production performance and scalability

-- ===============================
-- 1. NOTIFICATION SYSTEM OPTIMIZATION
-- ===============================

-- Enhanced indexes for notification queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at_desc ON notifications(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_priority_created ON notifications(priority, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_user ON notifications(type, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_metadata_business ON notifications USING GIN(metadata) WHERE metadata->>'business_event' = 'true';

-- Composite index for efficient pagination and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_composite ON notifications(user_id, is_read, created_at DESC);

-- ===============================
-- 2. QUOTATION SYSTEM OPTIMIZATION
-- ===============================

-- Optimize quotation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_status_created_at ON quotations(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_workflow_status ON quotations(workflow_status) WHERE workflow_status IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_created_by_status ON quotations(created_by, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_total_amount ON quotations(total_amount) WHERE total_amount > 0;

-- Optimize quotation events queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotation_events_date_range ON quotation_events(event_date) WHERE event_date >= CURRENT_DATE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotation_events_quotation_date ON quotation_events(quotation_id, event_date);

-- ===============================
-- 3. PERFORMANCE METRICS OPTIMIZATION
-- ===============================

-- Optimize sales performance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_performance_period_employee ON sales_performance_metrics(metric_period DESC, employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_performance_score ON sales_performance_metrics(performance_score DESC) WHERE performance_score IS NOT NULL;

-- Optimize employee queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_role_active ON employees(role) WHERE is_active = true;

-- ===============================
-- 4. ROW LEVEL SECURITY (RLS)
-- ===============================

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY notifications_user_access ON notifications
    FOR ALL 
    USING (user_id = current_user_id());

-- Policy: Admins can see all notifications
CREATE POLICY notifications_admin_access ON notifications
    FOR ALL 
    USING (current_user_role() IN ('Administrator', 'Sales Head'));

-- Function to get current user ID (to be implemented based on auth system)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER AS $$
BEGIN
    -- This should return the current authenticated user's ID
    -- Implementation depends on your authentication system
    RETURN COALESCE(
        (current_setting('app.current_user_id', true))::INTEGER,
        1 -- Fallback to admin user for now
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
    -- This should return the current user's role
    -- Implementation depends on your authentication system
    RETURN COALESCE(
        current_setting('app.current_user_role', true),
        'Administrator' -- Fallback for now
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- 5. NOTIFICATION CLEANUP & ARCHIVING
-- ===============================

-- Function to archive old notifications
CREATE OR REPLACE FUNCTION archive_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move notifications older than 90 days to archive table
    CREATE TABLE IF NOT EXISTS notifications_archive (LIKE notifications INCLUDING ALL);
    
    WITH moved_notifications AS (
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '90 days'
        AND is_read = true
        RETURNING *
    )
    INSERT INTO notifications_archive SELECT * FROM moved_notifications;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Log the archival
    INSERT INTO system_logs (action, details, created_at) 
    VALUES ('notification_archive', 
            jsonb_build_object('archived_count', archived_count), 
            NOW());
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 6. PERFORMANCE MONITORING
-- ===============================

-- Create system logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_action_time ON system_logs(action, created_at DESC);

-- Function to log performance metrics
CREATE OR REPLACE FUNCTION log_performance_metric(
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT DEFAULT 'ms'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO system_logs (action, details) 
    VALUES ('performance_metric', 
            jsonb_build_object(
                'metric', metric_name,
                'value', metric_value,
                'unit', metric_unit
            ));
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 7. NOTIFICATION BATCHING
-- ===============================

-- Table for notification batches (to prevent spam)
CREATE TABLE IF NOT EXISTS notification_batches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    batch_key VARCHAR(200) NOT NULL, -- For grouping similar notifications
    last_sent TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    count INTEGER DEFAULT 1,
    metadata JSONB,
    UNIQUE(user_id, notification_type, batch_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_batches_user_type ON notification_batches(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_batches_last_sent ON notification_batches(last_sent);

-- Function to check if notification should be batched
CREATE OR REPLACE FUNCTION should_batch_notification(
    p_user_id INTEGER,
    p_type VARCHAR(100),
    p_batch_key VARCHAR(200),
    p_batch_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    last_batch_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if similar notification was sent recently
    SELECT last_sent INTO last_batch_time
    FROM notification_batches
    WHERE user_id = p_user_id 
    AND notification_type = p_type 
    AND batch_key = p_batch_key;
    
    -- If no previous batch or batch window has passed, don't batch
    IF last_batch_time IS NULL OR 
       last_batch_time < NOW() - INTERVAL '1 minute' * p_batch_window_minutes THEN
        
        -- Update or insert batch record
        INSERT INTO notification_batches (user_id, notification_type, batch_key, last_sent, count)
        VALUES (p_user_id, p_type, p_batch_key, NOW(), 1)
        ON CONFLICT (user_id, notification_type, batch_key)
        DO UPDATE SET last_sent = NOW(), count = notification_batches.count + 1;
        
        RETURN FALSE; -- Don't batch, send notification
    END IF;
    
    -- Update batch count
    UPDATE notification_batches 
    SET count = count + 1
    WHERE user_id = p_user_id 
    AND notification_type = p_type 
    AND batch_key = p_batch_key;
    
    RETURN TRUE; -- Batch this notification
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 8. DATABASE MAINTENANCE
-- ===============================

-- Function for regular maintenance
CREATE OR REPLACE FUNCTION run_maintenance()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    archived_count INTEGER;
BEGIN
    -- Archive old notifications
    SELECT archive_old_notifications() INTO archived_count;
    result := result || format('Archived %s old notifications. ', archived_count);
    
    -- Update table statistics
    ANALYZE notifications;
    ANALYZE quotations;
    ANALYZE sales_performance_metrics;
    result := result || 'Updated table statistics. ';
    
    -- Clean up old system logs (keep last 30 days)
    DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '30 days';
    result := result || 'Cleaned up old system logs. ';
    
    -- Log maintenance completion
    INSERT INTO system_logs (action, details) 
    VALUES ('maintenance_completed', jsonb_build_object('summary', result));
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 9. CONSTRAINTS AND VALIDATION
-- ===============================

-- Add constraints for data integrity
ALTER TABLE notifications 
ADD CONSTRAINT chk_notifications_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE notifications 
ADD CONSTRAINT chk_notifications_user_id_positive 
CHECK (user_id > 0);

-- ===============================
-- 10. VIEWS FOR COMMON QUERIES
-- ===============================

-- View for unread notifications summary
CREATE OR REPLACE VIEW user_notification_summary AS
SELECT 
    user_id,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE is_read = false) as unread_count,
    COUNT(*) FILTER (WHERE priority = 'urgent' AND is_read = false) as urgent_unread,
    COUNT(*) FILTER (WHERE priority = 'high' AND is_read = false) as high_unread,
    MAX(created_at) as latest_notification
FROM notifications
GROUP BY user_id;

-- View for recent business notifications
CREATE OR REPLACE VIEW recent_business_notifications AS
SELECT 
    n.*,
    EXTRACT(EPOCH FROM (NOW() - n.created_at))/60 as minutes_ago
FROM notifications n
WHERE n.metadata->>'business_event' = 'true'
AND n.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY n.created_at DESC;

-- Grant permissions
GRANT SELECT ON user_notification_summary TO PUBLIC;
GRANT SELECT ON recent_business_notifications TO PUBLIC; 