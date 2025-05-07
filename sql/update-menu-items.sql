-- First, check if the menu_items table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'menu_items') THEN
        -- Remove the 'Dashboard' submenu from 'Sales' and 'People' main menu
        DELETE FROM menu_items 
        WHERE name = 'Dashboard' 
        AND parent_id IN (
            SELECT id FROM menu_items 
            WHERE name IN ('Sales', 'People')
        );
        
        -- Add 'Account Creation' and 'User Accounts' submenus under 'Organisation' main menu if they don't exist
        INSERT INTO menu_items (parent_id, name, icon, path, sort_order, is_visible)
        SELECT 
            (SELECT id FROM menu_items WHERE name = 'Organization' AND parent_id IS NULL),
            'Account Creation',
            'UserPlus',
            '/organization/account-creation',
            50,
            true
        WHERE NOT EXISTS (
            SELECT 1 FROM menu_items 
            WHERE name = 'Account Creation' 
            AND parent_id = (SELECT id FROM menu_items WHERE name = 'Organization' AND parent_id IS NULL)
        );
        
        INSERT INTO menu_items (parent_id, name, icon, path, sort_order, is_visible)
        SELECT 
            (SELECT id FROM menu_items WHERE name = 'Organization' AND parent_id IS NULL),
            'User Accounts',
            'Users',
            '/organization/user-accounts',
            60,
            true
        WHERE NOT EXISTS (
            SELECT 1 FROM menu_items 
            WHERE name = 'User Accounts' 
            AND parent_id = (SELECT id FROM menu_items WHERE name = 'Organization' AND parent_id IS NULL)
        );
        
        -- Add 'Manage Leads' submenu under 'Sales' main menu if it doesn't exist
        INSERT INTO menu_items (parent_id, name, icon, path, sort_order, is_visible)
        SELECT 
            (SELECT id FROM menu_items WHERE name = 'Sales' AND parent_id IS NULL),
            'Manage Leads',
            'ClipboardList',
            '/sales/manage-lead',
            25,
            true
        WHERE NOT EXISTS (
            SELECT 1 FROM menu_items 
            WHERE name = 'Manage Leads' 
            AND parent_id = (SELECT id FROM menu_items WHERE name = 'Sales' AND parent_id IS NULL)
        );
        
        -- Update sort orders to ensure consistent ordering
        UPDATE menu_items
        SET sort_order = CASE
            WHEN name = 'Create Lead' THEN 20
            WHEN name = 'Manage Leads' THEN 25
            WHEN name = 'My Leads' THEN 30
            WHEN name = 'Unassigned Leads' THEN 40
            WHEN name = 'Follow Up' THEN 50
            WHEN name = 'Quotation' THEN 60
            WHEN name = 'Order Confirmation' THEN 70
            WHEN name = 'Rejected Leads' THEN 80
            WHEN name = 'Lead Sources' THEN 90
            ELSE sort_order
        END
        WHERE parent_id = (SELECT id FROM menu_items WHERE name = 'Sales' AND parent_id IS NULL);
    END IF;
END
$$;

-- Return the updated menu structure for verification
SELECT m1.id, m1.name as main_menu, m2.name as submenu, m2.path, m2.sort_order
FROM menu_items m1
LEFT JOIN menu_items m2 ON m1.id = m2.parent_id
WHERE m1.parent_id IS NULL
ORDER BY m1.sort_order, m2.sort_order;
