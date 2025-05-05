-- Check the structure of the roles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roles';

-- See the first few roles to understand data structure
SELECT * FROM roles LIMIT 5;
