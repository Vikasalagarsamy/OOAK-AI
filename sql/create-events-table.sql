-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);

-- Add index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
