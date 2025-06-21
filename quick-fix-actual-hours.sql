-- Quick fix for missing actual_hours column in ai_tasks table
-- This resolves the API error: "Could not find the 'actual_hours' column of 'ai_tasks' in the schema cache"

-- Add the missing columns that the task update API expects
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2);
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5);

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_tasks' 
    AND column_name IN ('actual_hours', 'completed_at', 'quality_rating')
ORDER BY column_name;

-- Success message
SELECT 'Missing columns added successfully! Task update should now work.' as status; 