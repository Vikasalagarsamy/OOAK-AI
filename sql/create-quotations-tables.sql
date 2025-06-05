-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  follow_up_id INTEGER REFERENCES lead_followups(id),
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  bride_name VARCHAR(255) NOT NULL,
  groom_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50),
  alternate_mobile VARCHAR(50),
  alternate_whatsapp VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  default_package VARCHAR(20) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  created_by UUID NOT NULL,
  quotation_data JSONB NOT NULL,
  events_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotation events table
CREATE TABLE IF NOT EXISTS quotation_events (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_location VARCHAR(255) NOT NULL,
  venue_name VARCHAR(255) NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  expected_crowd VARCHAR(100),
  selected_package VARCHAR(20) NOT NULL,
  selected_services JSONB DEFAULT '[]',
  selected_deliverables JSONB DEFAULT '[]',
  service_overrides JSONB DEFAULT '{}',
  package_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON quotations(created_by);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_lead_id ON quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotation_events_quotation_id ON quotation_events(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotations_quotation_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);

-- Add some sample data for testing (optional)
-- You can remove this section if you don't want sample data

-- Add Row Level Security (RLS) policies
-- Enable RLS on quotations table
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on quotation_events table  
ALTER TABLE quotation_events ENABLE ROW LEVEL SECURITY;

-- Policy for quotations: users can only see their own quotations
CREATE POLICY "Users can view their own quotations" ON quotations
  FOR SELECT USING (auth.uid()::text = created_by::text);

CREATE POLICY "Users can insert their own quotations" ON quotations
  FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Users can update their own quotations" ON quotations
  FOR UPDATE USING (auth.uid()::text = created_by::text);

CREATE POLICY "Users can delete their own quotations" ON quotations
  FOR DELETE USING (auth.uid()::text = created_by::text);

-- Policy for quotation_events: users can access events for their quotations
CREATE POLICY "Users can view events for their quotations" ON quotation_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_events.quotation_id 
      AND quotations.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert events for their quotations" ON quotation_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_events.quotation_id 
      AND quotations.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update events for their quotations" ON quotation_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_events.quotation_id 
      AND quotations.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete events for their quotations" ON quotation_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_events.quotation_id 
      AND quotations.created_by::text = auth.uid()::text
    )
  ); 