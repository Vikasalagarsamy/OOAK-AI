-- Create speaker_corrections table for storing manual corrections
CREATE TABLE IF NOT EXISTS speaker_corrections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL,
  segment_id TEXT NOT NULL,
  text TEXT NOT NULL,
  suggested_speaker TEXT NOT NULL CHECK (suggested_speaker IN ('CLIENT', 'AGENT')),
  corrected_speaker TEXT NOT NULL CHECK (corrected_speaker IN ('CLIENT', 'AGENT')),
  confidence DECIMAL(3,2) DEFAULT 0.0,
  review_note TEXT DEFAULT '',
  reviewed_by TEXT DEFAULT 'sales_head',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_speaker_corrections_call_id ON speaker_corrections(call_id);
CREATE INDEX IF NOT EXISTS idx_speaker_corrections_segment_id ON speaker_corrections(segment_id);
CREATE INDEX IF NOT EXISTS idx_speaker_corrections_created_at ON speaker_corrections(created_at);

-- Add comments
COMMENT ON TABLE speaker_corrections IS 'Stores manual speaker corrections for 100% accuracy training';
COMMENT ON COLUMN speaker_corrections.call_id IS 'Reference to the call transcription';
COMMENT ON COLUMN speaker_corrections.segment_id IS 'Unique identifier for the conversation segment';
COMMENT ON COLUMN speaker_corrections.suggested_speaker IS 'AI suggested speaker (CLIENT or AGENT)';
COMMENT ON COLUMN speaker_corrections.corrected_speaker IS 'Manually corrected speaker (CLIENT or AGENT)';
COMMENT ON COLUMN speaker_corrections.confidence IS 'AI confidence score (0.00 to 1.00)';
COMMENT ON COLUMN speaker_corrections.review_note IS 'Optional notes from the reviewer';
COMMENT ON COLUMN speaker_corrections.reviewed_by IS 'Who made the correction (sales_head, admin, etc)'; 