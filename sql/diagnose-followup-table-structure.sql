-- Examine the lead_followups table structure
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'lead_followups'
ORDER BY 
    ordinal_position;
