-- Update existing AI tasks with lead_id values for quotation generation testing
-- This script will link existing tasks to leads so the quotation bridge can work

-- First, let's see what tasks and leads exist
SELECT 'Current Tasks:' as info, id, title, client_name, lead_id FROM ai_tasks ORDER BY id LIMIT 10;
SELECT 'Current Leads:' as info, id, client_name, email FROM leads ORDER BY id LIMIT 10;

-- Update tasks to link them with leads based on client names
-- Update first task to link with lead ID 1
UPDATE ai_tasks 
SET lead_id = 1, 
    client_name = COALESCE(client_name, 'Sample Client 1'),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('lead_id', 1, 'linked_for_quotation', true)
WHERE id = (SELECT id FROM ai_tasks ORDER BY id LIMIT 1);

-- Update second task to link with lead ID 2  
UPDATE ai_tasks 
SET lead_id = 2,
    client_name = COALESCE(client_name, 'Sample Client 2'),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('lead_id', 2, 'linked_for_quotation', true)
WHERE id = (SELECT id FROM ai_tasks ORDER BY id LIMIT 1 OFFSET 1);

-- Update third task to link with lead ID 3
UPDATE ai_tasks 
SET lead_id = 3,
    client_name = COALESCE(client_name, 'Sample Client 3'),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('lead_id', 3, 'linked_for_quotation', true)
WHERE id = (SELECT id FROM ai_tasks ORDER BY id LIMIT 1 OFFSET 2);

-- For testing, let's also create a completed task with lead_id and completion notes in metadata
UPDATE ai_tasks 
SET status = 'COMPLETED',
    completed_at = NOW(),
    lead_id = 1,
    client_name = 'Test Client for Quotation',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'lead_id', 1, 
        'completion_notes', 'Task completed successfully. Client expressed interest in proceeding.',
        'client_requirements', 'Website development with e-commerce functionality',
        'estimated_value', 45000,
        'business_impact', 'High value client conversion opportunity'
    )
WHERE id = (SELECT id FROM ai_tasks WHERE status != 'COMPLETED' ORDER BY id LIMIT 1);

-- Verify the updates
SELECT 'Updated Tasks:' as info, id, title, client_name, lead_id, status, metadata->>'completion_notes' as completion_notes FROM ai_tasks ORDER BY id; 