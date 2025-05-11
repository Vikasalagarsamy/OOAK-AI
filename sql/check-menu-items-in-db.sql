-- Check all menu items in the database
SELECT 
    id,
    name,
    path,
    parent_id,
    is_visible
FROM 
    menu_items
ORDER BY 
    parent_id NULLS FIRST, 
    sort_order;
