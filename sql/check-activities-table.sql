-- Check the structure of the activities table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'activities';

-- Look for activities related to lead L0017
SELECT *
FROM activities
WHERE entity_id = '23' OR entity_id = 'L0017';

-- Check if there are any other tables that might store rejection comments
SELECT 
    table_name
FROM 
    information_schema.tables
WHERE 
    table_name LIKE '%comment%' OR
    table_name LIKE '%note%' OR
    table_name LIKE '%reject%' OR
    table_name LIKE '%lead%';
