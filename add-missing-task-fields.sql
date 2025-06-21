-- Add missing fields to ai_tasks table for proper dashboard display
-- This fixes the "Unknown Client", "AI reasoning not available", and "Business impact not specified" issues

-- Add the missing columns that the dashboard expects
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS business_impact TEXT;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(12,2);
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS lead_id INTEGER;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS quotation_id INTEGER;

-- Update existing tasks to populate these fields from metadata
UPDATE ai_tasks 
SET 
    client_name = COALESCE(metadata->>'client_name', 'Unknown Client'),
    business_impact = COALESCE(metadata->>'business_impact', 'Business impact not specified'),
    ai_reasoning = COALESCE(metadata->>'ai_reasoning', 'AI reasoning not available'),
    estimated_value = COALESCE((metadata->>'estimated_value')::decimal, (metadata->>'total_amount')::decimal, 0),
    lead_id = COALESCE((metadata->>'lead_id')::integer, NULL),
    quotation_id = COALESCE((metadata->>'quotation_id')::integer, NULL)
WHERE client_name IS NULL OR business_impact IS NULL OR ai_reasoning IS NULL;

-- Also update tasks that currently show "Test Client" with real quotation data
UPDATE ai_tasks 
SET client_name = q.client_name
FROM quotations q 
WHERE ai_tasks.quotation_id = q.id 
  AND ai_tasks.client_name IN ('Test Client', 'Unknown Client');

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_ai_tasks_client_name ON ai_tasks(client_name);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_lead_id ON ai_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_quotation_id ON ai_tasks(quotation_id);

-- Verify the update
SELECT 
    'Schema update completed!' as status,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE client_name != 'Unknown Client') as tasks_with_client_names,
    COUNT(*) FILTER (WHERE business_impact != 'Business impact not specified') as tasks_with_business_impact,
    COUNT(*) FILTER (WHERE ai_reasoning != 'AI reasoning not available') as tasks_with_ai_reasoning
FROM ai_tasks; 