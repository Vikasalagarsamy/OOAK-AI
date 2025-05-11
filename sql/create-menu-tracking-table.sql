-- Function to create the menu tracking table if it doesn't exist
CREATE OR REPLACE FUNCTION create_menu_tracking_table()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'menu_items_tracking'
  ) THEN
    -- Create the tracking table
    CREATE TABLE menu_items_tracking (
      id SERIAL PRIMARY KEY,
      menu_item_id INTEGER NOT NULL UNIQUE,
      last_known_state JSONB NOT NULL,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create an index for faster lookups
    CREATE INDEX idx_menu_items_tracking_menu_item_id ON menu_items_tracking(menu_item_id);
    
    RETURN TRUE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to ensure the table exists
SELECT create_menu_tracking_table();
