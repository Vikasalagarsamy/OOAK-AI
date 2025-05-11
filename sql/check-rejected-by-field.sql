-- Check the structure of the rejected_by field
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'leads' 
    AND column_name = 'rejected_by';

-- Check how many rejected leads have null rejected_by values
SELECT 
    COUNT(*) as total_rejected_leads,
    COUNT(CASE WHEN rejected_by IS NULL THEN 1 END) as null_rejected_by_count
FROM 
    leads
WHERE 
    status = 'REJECTED';

-- Sample some rejected leads to see their current state
SELECT 
    id,
    lead_number,
    client_name,
    status,
    rejection_reason,
    rejected_at,
    rejected_by
FROM 
    leads
WHERE 
    status = 'REJECTED'
ORDER BY 
    updated_at DESC
LIMIT 5;
