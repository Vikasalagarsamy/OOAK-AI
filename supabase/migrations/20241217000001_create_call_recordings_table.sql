-- Create call_recordings table for storing uploaded call recordings from Android devices
CREATE TABLE IF NOT EXISTS call_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    contact_name TEXT,
    direction TEXT CHECK (direction IN ('incoming', 'outgoing', 'unknown')),
    call_start_time TIMESTAMPTZ,
    call_end_time TIMESTAMPTZ,
    recording_file_name TEXT NOT NULL,
    recording_file_path TEXT NOT NULL,
    recording_file_size BIGINT,
    device_id TEXT,
    is_matched BOOLEAN DEFAULT true,
    upload_timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'transcribed', 'failed')),
    transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
    transcription_text TEXT,
    transcription_confidence DECIMAL(3,2),
    ai_summary TEXT,
    ai_sentiment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_recordings_employee_id ON call_recordings(employee_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_phone_number ON call_recordings(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_recordings_upload_timestamp ON call_recordings(upload_timestamp);
CREATE INDEX IF NOT EXISTS idx_call_recordings_call_start_time ON call_recordings(call_start_time);
CREATE INDEX IF NOT EXISTS idx_call_recordings_status ON call_recordings(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_call_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_call_recordings_updated_at
    BEFORE UPDATE ON call_recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_call_recordings_updated_at();

-- Add RLS (Row Level Security)
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access recordings for their employee ID or if they're admin
CREATE POLICY "call_recordings_access_policy" ON call_recordings
    FOR ALL USING (
        employee_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR 
        (current_setting('request.jwt.claims', true)::json->>'role')::int = 1
    );

-- Grant permissions
GRANT ALL ON call_recordings TO authenticated;
GRANT ALL ON call_recordings TO anon;

-- Add foreign key constraints (optional, depends on your user system)
-- ALTER TABLE call_recordings ADD CONSTRAINT fk_call_recordings_employee 
--     FOREIGN KEY (employee_id) REFERENCES employees(employee_id);

-- Grant permissions
GRANT ALL ON call_recordings TO authenticated;
GRANT USAGE ON SEQUENCE call_recordings_id_seq TO authenticated; 