-- Check if lead_messages table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lead_messages') THEN
    CREATE TABLE lead_messages (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('email', 'sms')),
      subject VARCHAR(255),
      message_body TEXT NOT NULL,
      sent_by UUID NOT NULL,
      sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
      error_message TEXT
    );
    
    -- Add comment
    COMMENT ON TABLE lead_messages IS 'Stores messages sent to leads';
    
    -- Create index for faster lookups
    CREATE INDEX lead_messages_lead_id_idx ON lead_messages(lead_id);
    CREATE INDEX lead_messages_sent_by_idx ON lead_messages(sent_by);
    
    RAISE NOTICE 'Created lead_messages table';
  ELSE
    RAISE NOTICE 'lead_messages table already exists';
  END IF;
END
$$;
