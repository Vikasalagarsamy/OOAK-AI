"use server"

import { createClient } from "@/lib/supabase/server"

export async function addEventsSubmenuItem() {
  try {
    const supabase = createClient()

    // Read the SQL file content
    const sqlQuery = `
    -- Add Events sub-menu item to Event Co-ordination menu
    DO $$
    DECLARE
      parent_id INTEGER;
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
          is_visible
        )
        VALUES (
          parent_id,
          'Events',
          'Manage event names and details',
          'Calendar',
          '/events',
          25, -- Position between Event Calendar (20) and Create Event (30)
          true
        )
        ON CONFLICT (parent_id, name) DO NOTHING;
        
        -- Get the ID of the newly inserted menu item
        DECLARE
          new_menu_id INTEGER;
        BEGIN
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
          END IF;
        END;
        
        RAISE NOTICE 'Added Events sub-menu item to Event Co-ordination menu';
      ELSE
        RAISE NOTICE 'Event Co-ordination menu not found';
      END IF;
    END
    $$;
    `

    // Execute the SQL query
    const { error } = await supabase.rpc("execute_sql", {
      sql_statement: sqlQuery,
    })

    if (error) {
      console.error("Error adding Events submenu item:", error)
      return { success: false, error: error.message }
    }

    // Update the menu tracking to reflect the changes
    await supabase.rpc("execute_sql", {
      sql_statement: `
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
      `,
    })

    return { success: true }
  } catch (error) {
    console.error("Unexpected error adding Events submenu item:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
