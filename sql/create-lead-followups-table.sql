-- Check if lead_followups table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lead_followups') THEN
    CREATE TABLE lead_followups (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      followup_type VARCHAR(50) NOT NULL,
      scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
      notes TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'missed')),
      outcome TEXT
    );
    
    -- Add comment
    COMMENT ON TABLE lead_followups IS 'Stores scheduled follow-ups for leads';
    
    -- Create index for faster lookups
    CREATE INDEX lead_followups_lead_id_idx ON lead_followups(lead_id);
    CREATE INDEX lead_followups_created_by_idx ON lead_followups(created_by);
    CREATE INDEX lead_followups_scheduled_at_idx ON lead_followups(scheduled_at);
    
    RAISE NOTICE 'Created lead_followups table';
  ELSE
    RAISE NOTICE 'lead_followups table already exists';
  END IF;
END
$$;
