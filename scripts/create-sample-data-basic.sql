-- 🧪 Basic Sample Data for AI Notification Testing
-- User UUID: 764c38af-e49c-4fc0-9584-4cdcbbc3625c
-- This version uses only the most basic columns

-- First, let's check what tables and columns exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_behavior_analytics',
    'notification_patterns', 
    'user_preferences',
    'notification_engagement',
    'predictive_insights'
);

-- Check user_behavior_analytics columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_behavior_analytics' 
AND table_schema = 'public';

-- Check notification_patterns columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notification_patterns' 
AND table_schema = 'public';

-- Check notification_engagement columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notification_engagement' 
AND table_schema = 'public';

-- If user_behavior_analytics exists, try basic insert
-- (Only run this part after checking the columns above)

-- INSERT INTO user_behavior_analytics (user_id, engagement_score) 
-- VALUES ('764c38af-e49c-4fc0-9584-4cdcbbc3625c', 0.75);

-- INSERT INTO notification_engagement (user_id, event_type, timestamp)
-- VALUES ('764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'delivered', NOW());

-- Test a simple query to see if AI tables exist at all
SELECT COUNT(*) as total_ai_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%notification%' 
OR table_name LIKE '%behavior%' 
OR table_name LIKE '%insight%'; 