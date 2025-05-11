-- First, identify the IDs of the menu items to be removed
WITH admin_menu AS (
  SELECT id FROM menu_items WHERE name = 'Admin' AND parent_id IS NULL
),
items_to_remove AS (
  SELECT id FROM menu_items 
  WHERE parent_id = (SELECT id FROM admin_menu)
  AND name IN (
    'Menu Diagnostics', 
    'Menu Repair', 
    'Fix Admin Permissions', 
    'Test Permissions', 
    'Add Event Menu', 
    'Setup Menu Permissions', 
    'Fix Users By Role', 
    'Check Schema', 
    'Ensure Tables', 
    'Update Constraints', 
    'Update Employee Companies Table'
  )
)

-- Delete related permissions first to maintain referential integrity
DELETE FROM role_menu_permissions 
WHERE menu_item_id IN (SELECT id FROM items_to_remove);

-- Then delete the menu items
DELETE FROM menu_items 
WHERE id IN (SELECT id FROM items_to_remove);

-- Return the remaining Admin sub-menu items to verify
SELECT id, name, path, is_visible
FROM menu_items
WHERE parent_id = (SELECT id FROM admin_menu)
ORDER BY sort_order;
