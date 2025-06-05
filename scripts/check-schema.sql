-- 🔍 Check AI Tables Schema
-- This will show us what columns actually exist

-- 1. Check user_behavior_analytics table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_behavior_analytics' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check notification_patterns table structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_patterns' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check user_preferences table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check notification_engagement table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_engagement' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check predictive_insights table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'predictive_insights' 
AND table_schema = 'public'
ORDER BY ordinal_position; 