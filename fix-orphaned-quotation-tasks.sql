-- Fix Orphaned Quotation Rejection Tasks
-- =====================================
-- This script links quotation rejection tasks with their corresponding leads
-- by updating the lead_id field based on the quotation_id relationship.

-- 1. Show current orphaned tasks (for verification)
SELECT 
    t.id as task_id,
    t.task_title,
    t.assigned_to,
    t.quotation_id,
    t.lead_id as current_lead_id,
    q.lead_id as should_be_lead_id,
    q.quotation_number,
    q.client_name
FROM ai_tasks t
LEFT JOIN quotations q ON t.quotation_id = q.id
WHERE t.quotation_id IS NOT NULL 
    AND t.lead_id IS NULL
    AND t.task_type IN ('quotation_revision', 'quotation_approval', 'client_followup')
ORDER BY t.created_at DESC;

-- 2. Update orphaned tasks with correct lead_id
UPDATE ai_tasks 
SET 
    lead_id = quotations.lead_id,
    updated_at = NOW()
FROM quotations 
WHERE ai_tasks.quotation_id = quotations.id 
    AND ai_tasks.lead_id IS NULL 
    AND ai_tasks.quotation_id IS NOT NULL
    AND ai_tasks.task_type IN ('quotation_revision', 'quotation_approval', 'client_followup');

-- 3. Verify the fix by showing updated tasks
SELECT 
    t.id as task_id,
    t.task_title,
    t.assigned_to,
    t.quotation_id,
    t.lead_id,
    q.quotation_number,
    q.client_name,
    'FIXED' as status
FROM ai_tasks t
LEFT JOIN quotations q ON t.quotation_id = q.id
WHERE t.quotation_id IS NOT NULL 
    AND t.lead_id IS NOT NULL
    AND t.task_type IN ('quotation_revision', 'quotation_approval', 'client_followup')
    AND t.updated_at > NOW() - INTERVAL '1 minute'
ORDER BY t.updated_at DESC;

-- 4. Show the specific Ramya case
SELECT 
    t.id as task_id,
    t.task_title,
    t.assigned_to,
    t.assigned_to_employee_id,
    t.quotation_id,
    t.lead_id,
    q.quotation_number,
    q.client_name,
    q.lead_id as quotation_lead_id,
    e.first_name || ' ' || e.last_name as employee_name,
    e.department_id
FROM ai_tasks t
LEFT JOIN quotations q ON t.quotation_id = q.id
LEFT JOIN employees e ON t.assigned_to_employee_id = e.id
WHERE q.client_name = 'Ramya'
    AND t.task_type = 'quotation_revision'
ORDER BY t.created_at DESC
LIMIT 5; 