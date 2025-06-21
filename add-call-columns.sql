-- Add missing columns to call_transcriptions table for better call monitoring
ALTER TABLE call_transcriptions 
ADD COLUMN IF NOT EXISTS call_direction VARCHAR(20) DEFAULT 'outgoing',
ADD COLUMN IF NOT EXISTS call_status VARCHAR(20) DEFAULT 'processing';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_call_direction ON call_transcriptions(call_direction);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_call_status ON call_transcriptions(call_status);

-- Update existing records to have proper call_direction based on transcript
UPDATE call_transcriptions 
SET call_direction = CASE 
    WHEN transcript ILIKE '%incoming%' THEN 'incoming'
    ELSE 'outgoing'
END
WHERE call_direction = 'outgoing';

-- Update existing records to have proper call_status based on status
UPDATE call_transcriptions 
SET call_status = CASE 
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'processing' THEN 'processing'
    WHEN status = 'active' THEN 'connected'
    ELSE status
END
WHERE call_status = 'processing'; 