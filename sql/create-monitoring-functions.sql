-- Function to get daily reassignment counts
CREATE OR REPLACE FUNCTION get_daily_reassignment_counts(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
) 
RETURNS TABLE (
    date DATE,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(reassignment_date) as date,
        COUNT(*) as count
    FROM 
        leads
    WHERE 
        reassignment_date >= start_date
        AND reassignment_date <= end_date
        AND previous_assigned_to IS NOT NULL
    GROUP BY 
        DATE(reassignment_date)
    ORDER BY 
        date;
END;
$$ LANGUAGE plpgsql;

-- Function to get average processing time for reassignments
CREATE OR REPLACE FUNCTION get_avg_reassignment_processing_time(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    avg_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        AVG(EXTRACT(EPOCH FROM (a2.created_at - a1.created_at)) * 1000) as avg_ms
    FROM 
        activities a1
    JOIN 
        activities a2 ON a1.entity_id = a2.entity_id
    WHERE 
        a1.action_type = 'auto_reassign'
        AND a1.entity_type = 'employee'
        AND a2.action_type = 'auto_reassign'
        AND a2.entity_type = 'lead'
        AND a1.created_at >= start_date
        AND a1.created_at <= end_date
        AND a2.created_at >= a1.created_at
        AND a2.created_at <= a1.created_at + INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to get reassignment counts by reason
CREATE OR REPLACE FUNCTION get_reassignment_reason_counts(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    reason VARCHAR,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        reassignment_reason as reason,
        COUNT(*) as count
    FROM 
        leads
    WHERE 
        reassignment_date >= start_date
        AND reassignment_date <= end_date
        AND previous_assigned_to IS NOT NULL
    GROUP BY 
        reassignment_reason
    ORDER BY 
        count DESC;
END;
$$ LANGUAGE plpgsql;
