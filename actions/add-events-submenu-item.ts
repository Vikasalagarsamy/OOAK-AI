"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function addEventsSubmenuItem() {
  try {
    console.log("🗃️ Adding Events submenu item using PostgreSQL...")

    // Execute the complex SQL directly using PostgreSQL
    const sqlQuery = `
    -- Add Events sub-menu item to Event Co-ordination menu
    DO $$
    DECLARE
      parent_id INTEGER;
      new_menu_id INTEGER;
    BEGIN
      -- Get the ID of the Event Co-ordination menu
      SELECT id INTO parent_id 
      FROM menu_items 
      WHERE name = 'Event Co-ordination' AND parent_id IS NULL;
      
      IF parent_id IS NOT NULL THEN
        -- Add Events sub-menu
        INSERT INTO menu_items (
          parent_id,
          name,
          description,
          icon,
          path,
          sort_order,
          is_visible,
          created_at,
          updated_at
        )
        VALUES (
          parent_id,
          'Events',
          'Manage event names and details',
          'Calendar',
          '/events',
          25, -- Position between Event Calendar (20) and Create Event (30)
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (parent_id, name) DO NOTHING;
        
        -- Get the ID of the newly inserted menu item
        SELECT id INTO new_menu_id 
        FROM menu_items 
        WHERE name = 'Events' AND parent_id = parent_id;
        
        -- Add permissions for all roles for the new menu item
        IF new_menu_id IS NOT NULL THEN
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
          SELECT 
            id, -- role_id
            new_menu_id, -- menu_item_id
            id = 1, -- Only admin gets view by default
            id = 1, -- Only admin gets add by default
            id = 1, -- Only admin gets edit by default
            id = 1, -- Only admin gets delete by default
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          FROM roles
          ON CONFLICT (role_id, menu_item_id) DO NOTHING;
          
          RAISE NOTICE 'Added Events sub-menu item with ID: %', new_menu_id;
        END IF;
        
        RAISE NOTICE 'Added Events sub-menu item to Event Co-ordination menu';
      ELSE
        RAISE NOTICE 'Event Co-ordination menu not found';
      END IF;
    END
    $$;
    `

    // Execute the main SQL query
    await query(sqlQuery)

    // Update the menu tracking to reflect the changes
    const trackingUpdateSql = `
    -- Update menu tracking
    DELETE FROM menu_items_tracking;
    INSERT INTO menu_items_tracking (menu_item_id, last_known_state)
    SELECT 
      id,
      jsonb_build_object(
        'parentId', parent_id,
        'name', name,
        'path', path,
        'icon', icon,
        'isVisible', is_visible,
        'sortOrder', sort_order
      )
    FROM menu_items;
    `

    await query(trackingUpdateSql)

    console.log("✅ Events submenu item added successfully")
    return { success: true }
  } catch (error) {
    console.error("Error adding Events submenu item:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
