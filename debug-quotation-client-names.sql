-- Debug script to check quotation and task client names

-- 1. Check what quotations exist in the database
SELECT 
    'Real Quotations in Database:' as section,
    id,
    quotation_number,
    client_name,
    total_amount,
    status,
    created_at
FROM quotations 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check what tasks exist and their client names
SELECT 
    'Tasks with Client Names:' as section,
    id,
    task_title,
    client_name,
    quotation_id,
    metadata->>'client_name' as metadata_client_name,
    created_at
FROM ai_tasks 
WHERE client_name IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if any quotations have "Test Client" as client_name
SELECT 
    'Quotations with Test Client:' as section,
    id,
    quotation_number,
    client_name,
    total_amount
FROM quotations 
WHERE client_name ILIKE '%test%' OR client_name ILIKE '%unknown%';

-- 4. Check for tasks without proper client names that have quotation_id
SELECT 
    'Tasks needing client name fix:' as section,
    t.id,
    t.task_title,
    t.client_name as current_client_name,
    t.quotation_id,
    q.client_name as quotation_client_name
FROM ai_tasks t
LEFT JOIN quotations q ON t.quotation_id = q.id
WHERE (t.client_name IN ('Test Client', 'Unknown Client') OR t.client_name IS NULL)
  AND t.quotation_id IS NOT NULL;

-- 5. Fix the client names for tasks linked to real quotations
UPDATE ai_tasks 
SET client_name = q.client_name
FROM quotations q 
WHERE ai_tasks.quotation_id = q.id 
  AND (ai_tasks.client_name IN ('Test Client', 'Unknown Client') OR ai_tasks.client_name IS NULL)
  AND q.client_name IS NOT NULL
  AND q.client_name != '';

-- 6. Verify the fix
SELECT 
    'After Fix - Tasks with Real Client Names:' as section,
    COUNT(*) as count
FROM ai_tasks 
WHERE client_name IS NOT NULL 
  AND client_name NOT IN ('Test Client', 'Unknown Client', '');

SELECT 
    'Summary:' as section,
    'Database fix completed!' as status; 