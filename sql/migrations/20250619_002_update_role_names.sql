-- Update role names to match menu system
BEGIN;

-- First, create a new column for the role string ID
ALTER TABLE roles ADD COLUMN string_id VARCHAR(50);

-- Update existing roles with standardized string IDs
UPDATE roles SET string_id = 'admin' WHERE title = 'Administrator';
UPDATE roles SET string_id = 'accountant' WHERE title = 'Accountant';
UPDATE roles SET string_id = 'sales_executive' WHERE title = 'Sales Executive';
UPDATE roles SET string_id = 'sales_manager' WHERE title = 'Sales Manager';
UPDATE roles SET string_id = 'sales_head' WHERE title = 'Sales Head';
UPDATE roles SET string_id = 'admin_head' WHERE title = 'Admin Head';
UPDATE roles SET string_id = 'manager' WHERE title = 'Manager';
UPDATE roles SET string_id = 'employee' WHERE title = 'Employee';

-- Make string_id NOT NULL
ALTER TABLE roles ALTER COLUMN string_id SET NOT NULL;

-- Add unique constraint
ALTER TABLE roles ADD CONSTRAINT roles_string_id_key UNIQUE (string_id);

-- Add trigger to auto-generate string_id for new roles
CREATE OR REPLACE FUNCTION generate_role_string_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.string_id IS NULL THEN
    -- Convert title to lowercase and replace spaces with underscores
    NEW.string_id = LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '_', 'g'));
    
    -- If string_id already exists, append a number
    DECLARE
      counter INTEGER := 1;
      base_string_id VARCHAR := NEW.string_id;
    BEGIN
      WHILE EXISTS (SELECT 1 FROM roles WHERE string_id = NEW.string_id) LOOP
        NEW.string_id := base_string_id || '_' || counter;
        counter := counter + 1;
      END LOOP;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roles_string_id_trigger
BEFORE INSERT ON roles
FOR EACH ROW
EXECUTE FUNCTION generate_role_string_id();

COMMIT; 