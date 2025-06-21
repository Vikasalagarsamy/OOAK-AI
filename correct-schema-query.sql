-- Corrected query to get all table schemas
SELECT 
  table_schema,
  table_name,
  'CREATE TABLE ' || table_schema || '.' || table_name || ' (' ||
  string_agg(column_name || ' ' || data_type, ', ') || ');' as create_statement
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
GROUP BY table_schema, table_name
ORDER BY table_name;

-- Alternative simpler query - just get table names first
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Or even simpler - just count tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public'; 