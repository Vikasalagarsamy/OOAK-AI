-- Function to fix lead sources active status
CREATE OR REPLACE FUNCTION fix_lead_sources_active_status()
RETURNS TABLE(message TEXT, updated_count INTEGER) AS $$
DECLARE
    updated_count INTEGER := 0;
    constraint_exists BOOLEAN;
BEGIN
    -- Check if the table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_sources') THEN
        RETURN QUERY SELECT 'Lead sources table does not exist'::TEXT, 0::INTEGER;
        RETURN;
    END IF;

    -- Check if the is_active column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'lead_sources' AND column_name = 'is_active') THEN
        RETURN QUERY SELECT 'is_active column does not exist in lead_sources table'::TEXT, 0::INTEGER;
        RETURN;
    END IF;

    -- Update all inactive lead sources to active
    WITH updated AS (
        UPDATE lead_sources
        SET is_active = true
        WHERE is_active IS NULL OR is_active = false
        RETURNING *
    )
    SELECT COUNT(*) INTO updated_count FROM updated;

    -- Check if the default constraint exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'lead_sources' 
        AND column_name = 'is_active'
        AND column_default = 'true'
    ) INTO constraint_exists;

    -- Add default constraint if it doesn't exist
    IF NOT constraint_exists THEN
        ALTER TABLE lead_sources ALTER COLUMN is_active SET DEFAULT true;
    END IF;

    RETURN QUERY SELECT 
        CASE 
            WHEN updated_count > 0 THEN 'Successfully updated lead sources and ensured default constraint.'
            ELSE 'All lead sources are already active. Ensured default constraint is in place.'
        END::TEXT,
        updated_count;
END;
$$ LANGUAGE plpgsql;
