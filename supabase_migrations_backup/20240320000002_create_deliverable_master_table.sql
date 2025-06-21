-- Create deliverable_master table
CREATE TABLE IF NOT EXISTS deliverable_master (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('Main', 'Optional')),
  type TEXT NOT NULL CHECK (type IN ('Photo', 'Video')),
  deliverable_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS deliverable_master_category_idx ON deliverable_master(category);
CREATE INDEX IF NOT EXISTS deliverable_master_type_idx ON deliverable_master(type);
CREATE INDEX IF NOT EXISTS deliverable_master_deliverable_name_idx ON deliverable_master(deliverable_name);

-- Create composite index for category + type filtering
CREATE INDEX IF NOT EXISTS deliverable_master_category_type_idx ON deliverable_master(category, type);

-- Add RLS policies
ALTER TABLE deliverable_master ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all deliverable master data
CREATE POLICY "Authenticated users can view deliverable master" ON deliverable_master
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update/delete deliverable master data
-- (You can restrict this later based on user roles if needed)
CREATE POLICY "Authenticated users can manage deliverable master" ON deliverable_master
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert some sample data
INSERT INTO deliverable_master (category, type, deliverable_name) VALUES
('Main', 'Photo', 'Conventional Album 250X40'),
('Main', 'Photo', 'Candid Luxury 12X15 Inch'),
('Main', 'Photo', 'Candid NY 12X12 Inch'),
('Main', 'Video', '4K - Candid Film'),
('Main', 'Video', 'Highlight Video'),
('Optional', 'Photo', 'OG Pictures'),
('Optional', 'Photo', 'Edited Pictures'),
('Optional', 'Photo', 'MAGAZINE'),
('Optional', 'Video', 'Same Day Edit'),
('Optional', 'Video', 'Drone Video')
ON CONFLICT DO NOTHING; 