-- Create a function to delete multiple clients at once
CREATE OR REPLACE FUNCTION batch_delete_clients(client_ids INTEGER[])
RETURNS TABLE(
  deleted_id INTEGER,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  client_id INTEGER;
  result RECORD;
BEGIN
  -- For each client ID in the array
  FOREACH client_id IN ARRAY client_ids
  LOOP
    BEGIN
      -- Delete the client
      DELETE FROM clients WHERE id = client_id RETURNING id INTO result;
      
      -- Return success
      deleted_id := client_id;
      success := TRUE;
      error_message := NULL;
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Return failure with error message
      deleted_id := client_id;
      success := FALSE;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
