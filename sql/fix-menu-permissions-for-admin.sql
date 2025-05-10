-- Function to ensure all menu items are properly assigned to the Administrator role
CREATE OR REPLACE FUNCTION ensure_admin_menu_permissions()
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_role_id INTEGER;
  v_menu_item RECORD;
  v_count INTEGER;
BEGIN
  -- Get the Administrator role ID
  SELECT id INTO v_admin_role_id 
  FROM roles 
  WHERE title = 'Administrator' OR id = 1
  LIMIT 1;
  
  -- If no admin role found, return false
  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Administrator role not found';
    RETURN FALSE;
  END IF;
  
  -- Loop through all menu items
  FOR v_menu_item IN SELECT id FROM menu_items
  LOOP
    -- Check if permission already exists
    SELECT COUNT(*) INTO v_count
    FROM role_menu_permissions
    WHERE role_id = v_admin_role_id AND menu_item_id = v_menu_item.id;
    
    -- If permission doesn't exist, create it
    IF v_count = 0 THEN
      INSERT INTO role_menu_permissions (
        role_id,
        menu_item_id,
        can_view,
        can_add,
        can_edit,
        can_delete
      ) VALUES (
        v_admin_role_id,
        v_menu_item.id,
        TRUE,
        TRUE,
        TRUE,
        TRUE
      );
    ELSE
      -- Update existing permission to ensure all are enabled
      UPDATE role_menu_permissions
      SET 
        can_view = TRUE,
        can_add = TRUE,
        can_edit = TRUE,
        can_delete = TRUE
      WHERE 
        role_id = v_admin_role_id AND 
        menu_item_id = v_menu_item.id;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
