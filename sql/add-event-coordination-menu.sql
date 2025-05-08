-- Check if the menu_items table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'menu_items') THEN
    -- Get the highest sort_order for main menu items
    DECLARE
      max_sort_order INTEGER;
    BEGIN
      SELECT COALESCE(MAX(sort_order), 0) INTO max_sort_order 
      FROM menu_items 
      WHERE parent_id IS NULL;
      
      -- Insert the new Event Co-ordination main menu
      INSERT INTO menu_items (
        parent_id,
        name,
        description,
        icon,
        path,
        sort_order,
        is_visible
      )
      VALUES (
        NULL, -- parent_id (NULL for main menu)
        'Event Co-ordination', -- name
        'Manage and coordinate events and activities', -- description
        'Calendar', -- icon
        NULL, -- path (NULL for main menu with sub-items)
        max_sort_order + 10, -- sort_order (add 10 to place it after existing items)
        true -- is_visible
      )
      ON CONFLICT DO NOTHING
      RETURNING id;
    END;
  ELSE
    RAISE NOTICE 'menu_items table does not exist';
  END IF;
END
$$;

-- Add default permissions for all roles for the new menu item
DO $$
DECLARE
  new_menu_id INTEGER;
  role_record RECORD;
BEGIN
  -- Get the ID of the newly inserted menu item
  SELECT id INTO new_menu_id 
  FROM menu_items 
  WHERE name = 'Event Co-ordination' AND parent_id IS NULL;
  
  IF new_menu_id IS NOT NULL THEN
    -- For each role, add permissions for the new menu item
    FOR role_record IN SELECT id FROM roles LOOP
      -- Check if permission already exists
      IF NOT EXISTS (
        SELECT 1 FROM role_menu_permissions 
        WHERE role_id = role_record.id AND menu_item_id = new_menu_id
      ) THEN
        -- Insert default permission (admin gets all permissions, others get none)
        INSERT INTO role_menu_permissions (
          role_id, 
          menu_item_id, 
          can_view, 
          can_add, 
          can_edit, 
          can_delete,
          created_at,
          updated_at
        )
        VALUES (
          role_record.id,
          new_menu_id,
          role_record.id = 1, -- Only admin gets view by default
          role_record.id = 1, -- Only admin gets add by default
          role_record.id = 1, -- Only admin gets edit by default
          role_record.id = 1, -- Only admin gets delete by default
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        );
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Added Event Co-ordination menu with ID %', new_menu_id;
  ELSE
    RAISE NOTICE 'Failed to add Event Co-ordination menu';
  END IF;
END
$$;
