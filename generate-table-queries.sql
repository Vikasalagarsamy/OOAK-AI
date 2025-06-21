-- 📋 COPY TABLE SCHEMAS AND DATA - HELPER QUERIES
-- ==============================================
-- Run these queries in your REMOTE Supabase SQL Editor

-- 1️⃣ GET ALL TABLE NAMES
-- ====================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 2️⃣ GET TABLE SCHEMA FOR ANY TABLE
-- ================================
-- Replace 'TABLE_NAME' with your actual table name

SELECT 
    'CREATE TABLE ' || table_name || ' (' || chr(10) ||
    string_agg(
        '  ' || column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 
                CASE WHEN character_maximum_length IS NOT NULL 
                     THEN 'VARCHAR(' || character_maximum_length || ')'
                     ELSE 'TEXT' 
                END
            WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
            WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
            WHEN data_type = 'numeric' THEN 
                CASE WHEN numeric_precision IS NOT NULL 
                     THEN 'NUMERIC(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
                     ELSE 'NUMERIC' 
                END
            WHEN data_type = 'integer' THEN 'INTEGER'
            WHEN data_type = 'bigint' THEN 'BIGINT'
            WHEN data_type = 'boolean' THEN 'BOOLEAN'
            WHEN data_type = 'jsonb' THEN 'JSONB'
            WHEN data_type = 'json' THEN 'JSON'
            WHEN data_type = 'uuid' THEN 'UUID'
            WHEN data_type = 'date' THEN 'DATE'
            WHEN data_type = 'time without time zone' THEN 'TIME'
            ELSE UPPER(data_type)
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        ',' || chr(10)
        ORDER BY ordinal_position
    ) || chr(10) || ');' as create_statement
FROM information_schema.columns 
WHERE table_name = 'TABLE_NAME'  -- ⚠️ REPLACE THIS
AND table_schema = 'public'
GROUP BY table_name;

-- 3️⃣ GET TABLE DATA (SIMPLE)
-- =========================
-- Replace 'TABLE_NAME' with your actual table name

SELECT * FROM TABLE_NAME LIMIT 50;  -- ⚠️ REPLACE THIS

-- 4️⃣ GENERATE INSERT STATEMENTS
-- ============================
-- This is more complex, so let's use a simpler approach:

-- For each table, just run:
-- SELECT * FROM your_table;
-- Then copy the results and I'll help you convert them to INSERT statements!

-- 5️⃣ QUICK TABLE INFO
-- ==================
-- Get column info for any table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'TABLE_NAME'  -- ⚠️ REPLACE THIS
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6️⃣ EXAMPLE WORKFLOW
-- ==================
-- 1. Run query #1 to get all table names
-- 2. For each table, replace 'TABLE_NAME' in query #2 and run it
-- 3. Copy the CREATE TABLE statement 
-- 4. Paste it into your LOCAL Studio SQL Editor (http://127.0.0.1:54323)
-- 5. For each table, replace 'TABLE_NAME' in query #3 and run it
-- 6. Copy the data and convert to INSERT statements 