-- 🧪 Sample Data for AI Notification Testing (FIXED)
-- User UUID: 764c38af-e49c-4fc0-9584-4cdcbbc3625c
-- This version only uses columns that exist in the basic schema

-- 1. User Behavior Analytics (basic columns only)
INSERT INTO user_behavior_analytics (user_id, engagement_score, most_active_hours)
VALUES (
    '764c38af-e49c-4fc0-9584-4cdcbbc3625c',
    0.75,
    ARRAY[9, 10, 14, 15, 16]
) ON CONFLICT (user_id) DO UPDATE SET
    engagement_score = EXCLUDED.engagement_score,
    most_active_hours = EXCLUDED.most_active_hours;

-- 2. Notification Patterns (basic columns only)
INSERT INTO notification_patterns (type, optimal_hours, avg_response_time)
VALUES 
    ('quotation_update', ARRAY[10, 14, 16], 1800),
    ('business_update', ARRAY[9, 14, 17], 1200),
    ('marketing', ARRAY[10, 16, 18], 2400),
    ('reminder', ARRAY[8, 12, 15], 900)
ON CONFLICT (type) DO UPDATE SET
    optimal_hours = EXCLUDED.optimal_hours,
    avg_response_time = EXCLUDED.avg_response_time;

-- 3. User Preferences (basic columns only)
INSERT INTO user_preferences (user_id, ai_enabled, smart_timing)
VALUES (
    '764c38af-e49c-4fc0-9584-4cdcbbc3625c',
    true,
    true
) ON CONFLICT (user_id) DO UPDATE SET
    ai_enabled = EXCLUDED.ai_enabled,
    smart_timing = EXCLUDED.smart_timing;

-- 4. Sample Notification Engagement (basic columns only)
INSERT INTO notification_engagement (notification_id, user_id, event_type, timestamp)
VALUES 
    ('notif_001', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'delivered', NOW() - INTERVAL '2 hours'),
    ('notif_001', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'viewed', NOW() - INTERVAL '1 hour 45 minutes'),
    ('notif_001', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'clicked', NOW() - INTERVAL '1 hour 30 minutes'),
    ('notif_002', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'delivered', NOW() - INTERVAL '1 day'),
    ('notif_002', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'viewed', NOW() - INTERVAL '23 hours'),
    ('notif_003', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'delivered', NOW() - INTERVAL '3 days'),
    ('notif_003', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'dismissed', NOW() - INTERVAL '2 days 22 hours')
ON CONFLICT (notification_id, user_id, event_type) DO NOTHING;

-- 5. Predictive Insights (basic columns only)
INSERT INTO predictive_insights (user_id, insight_type, prediction_data, confidence_score)
VALUES 
    (
        '764c38af-e49c-4fc0-9584-4cdcbbc3625c',
        'engagement_prediction',
        jsonb_build_object(
            'predicted_engagement', 0.73,
            'optimal_timing', 'afternoon',
            'recommended_type', 'business_update'
        ),
        0.85
    ),
    (
        '764c38af-e49c-4fc0-9584-4cdcbbc3625c',
        'behavioral_pattern',
        jsonb_build_object(
            'pattern', 'high_afternoon_engagement',
            'trend', 'increasing',
            'recommendation', 'Focus on 2-4 PM delivery'
        ),
        0.78
    )
ON CONFLICT (user_id, insight_type) DO UPDATE SET
    prediction_data = EXCLUDED.prediction_data,
    confidence_score = EXCLUDED.confidence_score,
    created_at = NOW();

-- 6. Verify data was inserted
SELECT 'user_behavior_analytics' as table_name, COUNT(*) as records 
FROM user_behavior_analytics 
WHERE user_id = '764c38af-e49c-4fc0-9584-4cdcbbc3625c'

UNION ALL

SELECT 'notification_patterns', COUNT(*) 
FROM notification_patterns

UNION ALL  

SELECT 'user_preferences', COUNT(*) 
FROM user_preferences 
WHERE user_id = '764c38af-e49c-4fc0-9584-4cdcbbc3625c'

UNION ALL

SELECT 'notification_engagement', COUNT(*) 
FROM notification_engagement 
WHERE user_id = '764c38af-e49c-4fc0-9584-4cdcbbc3625c' 

UNION ALL

SELECT 'predictive_insights', COUNT(*) 
FROM predictive_insights 
WHERE user_id = '764c38af-e49c-4fc0-9584-4cdcbbc3625c';

-- 7. Show sample data for verification
SELECT 'User Behavior:' as section, user_id, engagement_score, most_active_hours 
FROM user_behavior_analytics 
WHERE user_id = '764c38af-e49c-4fc0-9584-4cdcbbc3625c'

UNION ALL

SELECT 'Preferences:', user_id::text, ai_enabled::text, smart_timing::text 
FROM user_preferences 
WHERE user_id = '764c38af-e49c-4fc0-9584-4cdcbbc3625c'; 