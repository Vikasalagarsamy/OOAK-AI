"use server"

import { createClient } from "@/lib/supabase/server"

export async function addManageLeadsMenuItem() {
  try {
    const supabase = createClient()

    // Read the SQL file content
    const sqlContent = `
    -- Check if the menu item already exists
    DO $$
    DECLARE
        sales_menu_id INTEGER;
        manage_leads_exists BOOLEAN;
    BEGIN
        -- Get the ID of the Sales menu
        SELECT id INTO sales_menu_id FROM menu_items WHERE name = 'Sales' AND parent_id IS NULL;
        
        -- Check if Manage Leads already exists
        SELECT EXISTS (
            SELECT 1 FROM menu_items 
            WHERE name = 'Manage Leads' AND parent_id = sales_menu_id
        ) INTO manage_leads_exists;
        
        -- If it doesn't exist, add it
        IF NOT manage_leads_exists AND sales_menu_id IS NOT NULL THEN
            INSERT INTO menu_items (
                name, 
                path, 
                icon, 
                parent_id, 
                is_visible, 
                sort_order, 
                description
            ) VALUES (
                'Manage Leads',
                '/sales/manage-lead',
                'list-checks',
                sales_menu_id,
                true,
                45, -- Position between My Leads and Unassigned Leads
                'Manage and update lead information'
            );
            
            RAISE NOTICE 'Manage Leads menu item added successfully';
        ELSE
            RAISE NOTICE 'Manage Leads menu item already exists or Sales menu not found';
        END IF;
    END $$;

    -- Add permissions for all roles that have access to other Sales menu items
    DO $$
    DECLARE
        manage_leads_id INTEGER;
        role_record RECORD;
    BEGIN
        -- Get the ID of the Manage Leads menu item
        SELECT id INTO manage_leads_id FROM menu_items WHERE name = 'Manage Leads' AND path = '/sales/manage-lead';
        
        IF manage_leads_id IS NOT NULL THEN
            -- For each role that has permissions for My Leads, add permissions for Manage Leads
            FOR role_record IN (
                SELECT DISTINCT rmp.role_id 
                FROM role_menu_permissions rmp
                JOIN menu_items mi ON rmp.menu_item_id = mi.id
                WHERE mi.name = 'My Leads' AND rmp.can_view = true
            ) LOOP
                -- Check if permission already exists
                IF NOT EXISTS (
                    SELECT 1 FROM role_menu_permissions 
                    WHERE role_id = role_record.role_id AND menu_item_id = manage_leads_id
                ) THEN
                    -- Add permission with the same access as My Leads
                    INSERT INTO role_menu_permissions (
                        role_id,
                        menu_item_id,
                        can_view,
                        can_add,
                        can_edit,
                        can_delete
                    )
                    SELECT 
                        role_id,
                        manage_leads_id,
                        can_view,
                        can_add,
                        can_edit,
                        can_delete
                    FROM role_menu_permissions
                    WHERE role_id = role_record.role_id
                    AND menu_item_id = (SELECT id FROM menu_items WHERE name = 'My Leads' AND parent_id = (SELECT id FROM menu_items WHERE name = 'Sales' AND parent_id IS NULL));
                    
                    RAISE NOTICE 'Added permissions for role ID %', role_record.role_id;
                ELSE
                    RAISE NOTICE 'Permissions already exist for role ID %', role_record.role_id;
                END IF;
            END LOOP;
        ELSE
            RAISE NOTICE 'Manage Leads menu item not found';
        END IF;
    END $$;
    `

    // Execute the SQL script
    const { error } = await supabase.rpc("execute_sql", { sql_statement: sqlContent })

    if (error) {
      console.error("Error executing SQL:", error)
      return { success: false, error: error.message }
    }

    // Clear menu cache by calling the refresh endpoint
    try {
      await fetch("/api/admin/refresh-menu-cache", { method: "POST" })
    } catch (e) {
      console.warn("Could not refresh menu cache:", e)
    }

    return { success: true }
  } catch (error) {
    console.error("Error in addManageLeadsMenuItem:", error)
    return { success: false, error: String(error) }
  }
}
