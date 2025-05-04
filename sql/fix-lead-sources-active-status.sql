-- First, update all existing lead sources to active
UPDATE lead_sources
SET is_active = true
WHERE is_active IS NULL OR is_active = false;

-- Then, add default constraint to is_active column if it doesn't exist
DO $$
BEGIN
    -- Check if the column has a default value
    IF NOT EXISTS (
        SELECT 1
        FROM pg_attrdef ad
        JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
        JOIN pg_class c ON c.oid = ad.adrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'lead_sources'
        AND a.attname = 'is_active'
        AND n.nspname = 'public'
    ) THEN
        -- Add the default constraint
        ALTER TABLE lead_sources 
        ALTER COLUMN is_active SET DEFAULT true;
    END IF;
END $$;

-- Verify the changes
SELECT id, name, is_active FROM lead_sources;
