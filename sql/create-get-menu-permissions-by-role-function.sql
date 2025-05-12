-- Function to get menu permissions by role ID
CREATE OR REPLACE FUNCTION get_menu_permissions_by_role(p_role_id INTEGER)
RETURNS TABLE (
  menu_item_id INTEGER,
  parent_id INTEGER,
  menu_name TEXT,
  menu_path TEXT,
  icon TEXT,
  is_visible BOOLEAN,
  sort_order INTEGER,
  can_view BOOLEAN,
  can_add BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mi.id AS menu_item_id,
    mi.parent_id,
    mi.name AS menu_name,
    mi.path AS menu_path,
    mi.icon,
    mi.is_visible,
    mi.sort_order,
    COALESCE(rmp.can_view, FALSE) AS can_view,
    COALESCE(rmp.can_add, FALSE) AS can_add,
    COALESCE(rmp.can_edit, FALSE) AS can_edit,
    COALESCE(rmp.can_delete, FALSE) AS can_delete
  FROM 
    menu_items mi
  LEFT JOIN 
    role_menu_permissions rmp ON mi.id = rmp.menu_item_id AND rmp.role_id = p_role_id
  ORDER BY 
    mi.sort_order;
END;
$$ LANGUAGE plpgsql;
