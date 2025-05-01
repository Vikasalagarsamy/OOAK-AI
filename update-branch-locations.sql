-- Add location column to branches table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'branches' AND column_name = 'location'
    ) THEN
        ALTER TABLE branches ADD COLUMN location VARCHAR(255);
    END IF;
END $$;

-- Update branch locations based on address and name
UPDATE branches
SET location = 
    CASE 
        WHEN name ILIKE '%chennai%' OR address ILIKE '%chennai%' THEN 'Chennai'
        WHEN name ILIKE '%bangalore%' OR address ILIKE '%bangalore%' THEN 'Bangalore'
        WHEN name ILIKE '%mumbai%' OR address ILIKE '%mumbai%' THEN 'Mumbai'
        WHEN name ILIKE '%delhi%' OR address ILIKE '%delhi%' THEN 'Delhi'
        WHEN name ILIKE '%hyderabad%' OR address ILIKE '%hyderabad%' THEN 'Hyderabad'
        WHEN name ILIKE '%kolkata%' OR address ILIKE '%kolkata%' THEN 'Kolkata'
        WHEN name ILIKE '%pune%' OR address ILIKE '%pune%' THEN 'Pune'
        ELSE address
    END
WHERE location IS NULL;

-- Show updated branch data
SELECT id, name, location, address FROM branches;
