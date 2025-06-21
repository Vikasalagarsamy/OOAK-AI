-- Add call_status column to call_transcriptions table for detailed call status tracking
-- This allows us to track ringing, connected, completed, missed, unanswered statuses

ALTER TABLE call_transcriptions 
ADD COLUMN IF NOT EXISTS call_status VARCHAR(20) DEFAULT 'processing';

-- Add call_direction column if it doesn't exist
ALTER TABLE call_transcriptions 
ADD COLUMN IF NOT EXISTS call_direction VARCHAR(20) DEFAULT 'outgoing';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_call_status ON call_transcriptions(call_status);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_call_direction ON call_transcriptions(call_direction);

-- Update existing records to have proper call_status based on transcript
UPDATE call_transcriptions 
SET call_status = CASE 
    WHEN transcript ILIKE '%ringing%' THEN 'ringing'
    WHEN transcript ILIKE '%connected%' THEN 'connected'
    WHEN transcript ILIKE '%completed successfully%' THEN 'completed'
    WHEN transcript ILIKE '%missed call%' THEN 'missed'
    WHEN transcript ILIKE '%unanswered call%' THEN 'unanswered'
    WHEN status = 'completed' THEN 'completed'
    ELSE 'processing'
END
WHERE call_status = 'processing';

-- Update existing records to have proper call_direction based on transcript or notes
UPDATE call_transcriptions 
SET call_direction = CASE 
    WHEN transcript ILIKE '%incoming%' OR notes ILIKE '%direction: incoming%' THEN 'incoming'
    WHEN transcript ILIKE '%outgoing%' OR notes ILIKE '%direction: outgoing%' THEN 'outgoing'
    ELSE 'outgoing'
END
WHERE call_direction = 'outgoing';

-- Add comment for documentation
COMMENT ON COLUMN call_transcriptions.call_status IS 'Detailed call status: ringing, connected, completed, missed, unanswered, processing';
COMMENT ON COLUMN call_transcriptions.call_direction IS 'Call direction: incoming, outgoing'; 