-- Function to ensure the menu tracking table exists
CREATE OR REPLACE FUNCTION ensure_menu_tracking_table()
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

-- Function to update menu item permissions
CREATE OR REPLACE FUNCTION update_menu_item_permissions(
  p_role_id INTEGER,
  p_menu_item_id INTEGER,
  p_can_view BOOLEAN,
  p_can_add BOOLEAN,
  p_can_edit BOOLEAN,
  p_can_delete BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the permission record exists
  IF EXISTS (
    SELECT 1 FROM menu_permissions 
    WHERE role_id = p_role_id AND menu_item_id = p_menu_item_id
  ) THEN
    -- Update existing permission
    UPDATE menu_permissions
    SET 
      can_view = p_can_view,
      can_add = p_can_add,
      can_edit = p_can_edit,
      can_delete = p_can_delete,
      updated_at = NOW()
    WHERE role_id = p_role_id AND menu_item_id = p_menu_item_id;
  ELSE
    -- Insert new permission
    INSERT INTO menu_permissions (
      role_id, menu_item_id, can_view, can_add, can_edit, can_delete, created_at, updated_at
    ) VALUES (
      p_role_id, p_menu_item_id, p_can_view, p_can_add, p_can_edit, p_can_delete, NOW(), NOW()
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to ensure the table exists
SELECT ensure_menu_tracking_table();
