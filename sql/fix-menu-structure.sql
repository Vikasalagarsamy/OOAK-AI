-- Step 1: Verify menu items exist and have correct parent_id relationships
SELECT 
  mi.id, mi.name, mi.parent_id, mi.path, mi.is_visible,
  (SELECT m2.name FROM menu_items m2 WHERE m2.id = mi.parent_id) as parent_name
FROM 
  menu_items mi
ORDER BY 
  mi.parent_id NULLS FIRST, mi.sort_order;

-- Step 2: Ensure all items have permissions for Administrator role
INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
SELECT 
  1, -- Administrator role ID
  mi.id,
  TRUE, TRUE, TRUE, TRUE
FROM 
  menu_items mi
WHERE 
  NOT EXISTS (
    SELECT 1 FROM role_menu_permissions 
    WHERE role_id = 1 AND menu_item_id = mi.id
  );

-- Step 3: Update visibility for all menu items
UPDATE menu_items
SET is_visible = TRUE
WHERE is_visible = FALSE;

-- Step 4: Return the updated permissions to verify
SELECT 
  r.title as role_name,
  mi.id as menu_id,
  mi.name as menu_name,
  mi.path,
  mi.parent_id,
  (SELECT m2.name FROM menu_items m2 WHERE m2.id = mi.parent_id) as parent_name,
  rmp.can_view,
  rmp.can_add,
  rmp.can_edit,
  rmp.can_delete
FROM 
  roles r
JOIN 
  role_menu_permissions rmp ON r.id = rmp.role_id
JOIN 
  menu_items mi ON rmp.menu_item_id = mi.id
WHERE 
  r.id = 1 -- Administrator role
ORDER BY 
  mi.parent_id NULLS FIRST, mi.sort_order;
