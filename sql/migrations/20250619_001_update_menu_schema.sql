-- Update menu schema to use string IDs
BEGIN;

-- 1. Make string_id required and unique
ALTER TABLE menu_items ALTER COLUMN string_id SET NOT NULL;
ALTER TABLE menu_items ADD CONSTRAINT menu_items_string_id_unique UNIQUE (string_id);

-- 2. Add menu_string_id to role_menu_permissions
ALTER TABLE role_menu_permissions ADD COLUMN menu_string_id varchar(100);

-- 3. Copy data from menu_item_id to menu_string_id
UPDATE role_menu_permissions rmp
SET menu_string_id = mi.string_id
FROM menu_items mi
WHERE rmp.menu_item_id = mi.id;

-- 4. Make menu_string_id required and add foreign key
ALTER TABLE role_menu_permissions ALTER COLUMN menu_string_id SET NOT NULL;
ALTER TABLE role_menu_permissions ADD CONSTRAINT fk_menu_string_id 
  FOREIGN KEY (menu_string_id) REFERENCES menu_items(string_id);

-- 5. Drop old menu_item_id column
ALTER TABLE role_menu_permissions DROP COLUMN menu_item_id;

-- 6. Add parent_string_id to menu_items
ALTER TABLE menu_items ADD COLUMN parent_string_id varchar(100);

-- 7. Copy data from parent_id to parent_string_id
UPDATE menu_items child
SET parent_string_id = parent.string_id
FROM menu_items parent
WHERE child.parent_id = parent.id;

-- 8. Add foreign key for parent_string_id
ALTER TABLE menu_items ADD CONSTRAINT fk_parent_string_id 
  FOREIGN KEY (parent_string_id) REFERENCES menu_items(string_id);

-- 9. Drop old parent_id column
ALTER TABLE menu_items DROP COLUMN parent_id;

-- 10. Drop old id column and sequence
ALTER TABLE menu_items DROP COLUMN id;
DROP SEQUENCE menu_items_id_seq;

COMMIT; 