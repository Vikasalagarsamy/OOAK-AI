-- Modify the entity_id column to accept any string (TEXT) instead of UUID
ALTER TABLE activities 
ALTER COLUMN entity_id TYPE TEXT;

-- Update the indexes to work with the new column type
DROP INDEX IF EXISTS idx_activities_entity_type;
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);

-- Add a new index for entity_id
CREATE INDEX IF NOT EXISTS idx_activities_entity_id ON activities(entity_id);
