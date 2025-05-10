CREATE OR REPLACE FUNCTION get_complete_menu_tree(p_role_id INT)
RETURNS TABLE (
  id INT,
  parent_id INT,
  name TEXT,
  path TEXT,
  icon TEXT,
  sort_order INT,
  is_visible BOOLEAN,
  can_view BOOLEAN,
  can_add BOOLEAN, 
  can_edit BOOLEAN,
  can_delete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mi.id,
    mi.parent_id,
    mi.name,
    mi.path,
    mi.icon,
    mi.sort_order,
    mi.is_visible,
    COALESCE(rmp.can_view, FALSE) AS can_view,
    COALESCE(rmp.can_add, FALSE) AS can_add,
    COALESCE(rmp.can_edit, FALSE) AS can_edit,
    COALESCE(rmp.can_delete, FALSE) AS can_delete
  FROM 
    menu_items mi
  LEFT JOIN 
    role_menu_permissions rmp ON mi.id = rmp.menu_item_id AND rmp.role_id = p_role_id
  WHERE
    mi.is_visible = TRUE
  ORDER BY 
    mi.parent_id NULLS FIRST, mi.sort_order;
END;
$$ LANGUAGE plpgsql;
