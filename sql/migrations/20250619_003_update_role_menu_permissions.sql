-- Update role_menu_permissions to use string IDs
BEGIN;

-- Add menu_string_id column
ALTER TABLE role_menu_permissions ADD COLUMN menu_string_id varchar(100);

-- Copy data from menu_item_id to menu_string_id
UPDATE role_menu_permissions rmp
SET menu_string_id = mi.string_id
FROM menu_items mi
WHERE rmp.menu_item_id = mi.id;

-- Make menu_string_id required and add foreign key
ALTER TABLE role_menu_permissions ALTER COLUMN menu_string_id SET NOT NULL;
ALTER TABLE role_menu_permissions ADD CONSTRAINT fk_menu_string_id 
  FOREIGN KEY (menu_string_id) REFERENCES menu_items(string_id);

-- Drop the old menu_item_id column
ALTER TABLE role_menu_permissions DROP COLUMN menu_item_id;

COMMIT; 