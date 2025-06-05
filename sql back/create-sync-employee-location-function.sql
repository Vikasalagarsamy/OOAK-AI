-- Function to sync employee location with their branch location
CREATE OR REPLACE FUNCTION sync_employee_location()
RETURNS TRIGGER AS $$
BEGIN
    -- If branch_id is NULL or 'none', set location to 'Remote'
    IF NEW.branch_id IS NULL THEN
        NEW.location = 'Remote';
    ELSE
        -- Update employee location with branch location
        SELECT b.location INTO NEW.location
        FROM branches b
        WHERE b.id = NEW.branch_id;
        
        -- If no branch found or branch has no location, set to 'Unknown'
        IF NEW.location IS NULL THEN
            NEW.location = 'Unknown';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
