-- Add sub-menu items for Event Co-ordination
DO $$
DECLARE
  parent_id INTEGER;
BEGIN
  -- Get the ID of the Event Co-ordination menu
  SELECT id INTO parent_id 
  FROM menu_items 
  WHERE name = 'Event Co-ordination' AND parent_id IS NULL;
  
  IF parent_id IS NOT NULL THEN
    -- Add Event Dashboard sub-menu
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
      parent_id,
      'Event Dashboard',
      'Overview of all events and activities',
      'LayoutDashboard',
      '/events/dashboard',
      10,
      true
    )
    ON CONFLICT DO NOTHING;
    
    -- Add Event Calendar sub-menu
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
      parent_id,
      'Event Calendar',
      'Calendar view of all scheduled events',
      'CalendarDays',
      '/events/calendar',
      20,
      true
    )
    ON CONFLICT DO NOTHING;
    
    -- Add Create Event sub-menu
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
      parent_id,
      'Create Event',
      'Create a new event or activity',
      'PlusCircle',
      '/events/create',
      30,
      true
    )
    ON CONFLICT DO NOTHING;
    
    -- Add Event Types sub-menu
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
      parent_id,
      'Event Types',
      'Manage different types of events',
      'Tags',
      '/events/types',
      40,
      true
    )
    ON CONFLICT DO NOTHING;
    
    -- Add Event Reports sub-menu
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
      parent_id,
      'Event Reports',
      'View reports and analytics for events',
      'BarChart',
      '/events/reports',
      50,
      true
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Added sub-menu items for Event Co-ordination';
  ELSE
    RAISE NOTICE 'Event Co-ordination menu not found';
  END IF;
END
$$;

-- Add permissions for all roles for the new sub-menu items
DO $$
DECLARE
  parent_id INTEGER;
  submenu_id INTEGER;
  role_record RECORD;
BEGIN
  -- Get the ID of the Event Co-ordination menu
  SELECT id INTO parent_id 
  FROM menu_items 
  WHERE name = 'Event Co-ordination' AND parent_id IS NULL;
  
  IF parent_id IS NOT NULL THEN
    -- For each sub-menu item
    FOR submenu_id IN 
      SELECT id FROM menu_items WHERE parent_id = parent_id
    LOOP
      -- For each role
      FOR role_record IN SELECT id FROM roles LOOP
        -- Check if permission already exists
        IF NOT EXISTS (
          SELECT 1 FROM role_menu_permissions 
          WHERE role_id = role_record.id AND menu_item_id = submenu_id
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
            submenu_id,
            role_record.id = 1, -- Only admin gets view by default
            role_record.id = 1, -- Only admin gets add by default
            role_record.id = 1, -- Only admin gets edit by default
            role_record.id = 1, -- Only admin gets delete by default
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          );
        END IF;
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Added permissions for sub-menu items';
  ELSE
    RAISE NOTICE 'Event Co-ordination menu not found';
  END IF;
END
$$;
