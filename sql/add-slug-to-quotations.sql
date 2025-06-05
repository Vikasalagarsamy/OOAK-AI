-- Add slug column to quotations table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotations' AND column_name = 'slug') THEN
        ALTER TABLE quotations ADD COLUMN slug VARCHAR(255);
    END IF;
END $$;

-- Create unique index on slug for performance and uniqueness (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'quotations' AND indexname = 'quotations_slug_unique') THEN
        CREATE UNIQUE INDEX quotations_slug_unique ON quotations(slug);
    END IF;
END $$;

-- Function to generate random string for slug
CREATE OR REPLACE FUNCTION generate_random_string(length INT)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INT;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing quotations with unique slugs (only those with NULL slugs)
DO $$
DECLARE
    quotation_record RECORD;
    base_slug TEXT;
    final_slug TEXT;
    attempt_count INT;
    max_attempts INT := 10;
    slug_exists BOOLEAN;
BEGIN
    -- Loop through all quotations that don't have slugs
    FOR quotation_record IN 
        SELECT id, quotation_number 
        FROM quotations 
        WHERE slug IS NULL
    LOOP
        -- Create base slug from quotation number
        base_slug := lower(regexp_replace(quotation_record.quotation_number, '[^a-zA-Z0-9]', '-', 'g'));
        attempt_count := 0;
        
        -- Try to generate a unique slug
        WHILE attempt_count < max_attempts LOOP
            final_slug := base_slug || '-' || generate_random_string(6);
            
            -- Check if slug already exists
            SELECT EXISTS(SELECT 1 FROM quotations WHERE slug = final_slug) INTO slug_exists;
            
            IF NOT slug_exists THEN
                -- Update the quotation with the unique slug
                UPDATE quotations 
                SET slug = final_slug, updated_at = NOW()
                WHERE id = quotation_record.id;
                EXIT;
            END IF;
            
            attempt_count := attempt_count + 1;
        END LOOP;
        
        -- Fallback: use timestamp if we couldn't generate unique slug
        IF attempt_count >= max_attempts THEN
            final_slug := base_slug || '-' || extract(epoch from now())::bigint;
            UPDATE quotations 
            SET slug = final_slug, updated_at = NOW()
            WHERE id = quotation_record.id;
        END IF;
    END LOOP;
END $$;

-- Make slug column NOT NULL after populating existing records (only if no NULL values remain)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM quotations WHERE slug IS NULL) THEN
        ALTER TABLE quotations ALTER COLUMN slug SET NOT NULL;
    END IF;
END $$;

-- Add comment to document the slug column
COMMENT ON COLUMN quotations.slug IS 'URL-safe unique identifier for public quotation sharing'; 