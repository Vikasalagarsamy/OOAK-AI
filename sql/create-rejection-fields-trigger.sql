-- Function to automatically set rejection fields when a lead is rejected
CREATE OR REPLACE FUNCTION ensure_rejection_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if status is REJECTED but rejection fields are null
  IF NEW.status = 'REJECTED' THEN
    -- Set rejection_reason if null
    IF NEW.rejection_reason IS NULL THEN
      NEW.rejection_reason := 'No reason provided (auto-filled by trigger)';
    END IF;
    
    -- Set rejected_at if null
    IF NEW.rejected_at IS NULL THEN
      NEW.rejected_at := NOW();
    END IF;
    
    -- Note: We can't set rejected_by automatically as we don't have the user context
    -- This will need to be handled by the application code
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS ensure_rejection_fields_trigger ON leads;

-- Create trigger to run before insert or update
CREATE TRIGGER ensure_rejection_fields_trigger
BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION ensure_rejection_fields();
