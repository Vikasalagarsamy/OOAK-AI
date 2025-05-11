-- Check if lead_notes table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lead_notes') THEN
    CREATE TABLE lead_notes (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      note TEXT NOT NULL,
      note_type VARCHAR(50) NOT NULL DEFAULT 'general',
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    
    -- Add comment
    COMMENT ON TABLE lead_notes IS 'Stores notes and comments related to leads';
    
    -- Create index for faster lookups
    CREATE INDEX lead_notes_lead_id_idx ON lead_notes(lead_id);
    CREATE INDEX lead_notes_created_by_idx ON lead_notes(created_by);
    
    RAISE NOTICE 'Created lead_notes table';
  ELSE
    RAISE NOTICE 'lead_notes table already exists';
  END IF;
END
$$;
