-- 🧪 Sample Data for AI Notification Testing
-- User UUID: 764c38af-e49c-4fc0-9584-4cdcbbc3625c

-- 1. User Behavior Analytics
INSERT INTO user_behavior_analytics (user_id, engagement_score, most_active_hours, preferred_types, response_patterns)
VALUES (
    '764c38af-e49c-4fc0-9584-4cdcbbc3625c',
    0.75,
    ARRAY[9, 10, 14, 15, 16],
    ARRAY['quotation_update', 'business_update'],
    jsonb_build_object(
        'avg_response_time', 1800,
        'click_through_rate', 0.23,
        'preferred_timing', 'afternoon'
    )
);

-- 2. Notification Patterns
INSERT INTO notification_patterns (type, optimal_hours, avg_response_time, engagement_rate)
VALUES 
    ('quotation_update', ARRAY[10, 14, 16], 1800, 0.78),
    ('business_update', ARRAY[9, 14, 17], 1200, 0.65),
    ('marketing', ARRAY[10, 16, 18], 2400, 0.45),
    ('reminder', ARRAY[8, 12, 15], 900, 0.82);

-- 3. User Preferences
INSERT INTO user_preferences (user_id, ai_enabled, smart_timing, personalization_level, notification_frequency)
VALUES (
    '764c38af-e49c-4fc0-9584-4cdcbbc3625c',
    true,
    true,
    'high',
    'moderate'
);

-- 4. Sample Notification Engagement (past data)
INSERT INTO notification_engagement (notification_id, user_id, event_type, timestamp, response_time)
VALUES 
    ('notif_001', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'delivered', NOW() - INTERVAL '2 hours', NULL),
    ('notif_001', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'viewed', NOW() - INTERVAL '1 hour 45 minutes', 900),
    ('notif_001', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'clicked', NOW() - INTERVAL '1 hour 30 minutes', 1800),
    ('notif_002', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'delivered', NOW() - INTERVAL '1 day', NULL),
    ('notif_002', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'viewed', NOW() - INTERVAL '23 hours', 1200),
    ('notif_003', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'delivered', NOW() - INTERVAL '3 days', NULL),
    ('notif_003', '764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'dismissed', NOW() - INTERVAL '2 days 22 hours', 3600);

-- 5. Predictive Insights
INSERT INTO predictive_insights (user_id, insight_type, prediction_data, confidence_score, created_at)
VALUES 
    (
        '764c38af-e49c-4fc0-9584-4cdcbbc3625c',
        'engagement_prediction',
        jsonb_build_object(
            'predicted_engagement', 0.73,
            'optimal_timing', 'afternoon',
            'recommended_type', 'business_update'
        ),
        0.85,
        NOW()
    ),
    (
        '764c38af-e49c-4fc0-9584-4cdcbbc3625c',
        'behavioral_pattern',
        jsonb_build_object(
            'pattern', 'high_afternoon_engagement',
            'trend', 'increasing',
            'recommendation', 'Focus on 2-4 PM delivery'
        ),
        0.78,
        NOW() - INTERVAL '1 day'
    );

-- 6. Verify data was inserted
SELECT 'user_behavior_analytics' as table_name, COUNT(*) as records FROM user_behavior_analytics WHERE user_id = '764c38af-e49c-4fc0-9584-4cdcbbc3625c'
UNION ALL
SELECT 'notification_patterns', COUNT(*) FROM notification_patterns
UNION ALL  
SELECT 'user_preferences', COUNT(*) FROM user_preferences WHERE user_id = '764c38af-e49c-4fc0-9584-4cdcbbc3625c'
UNION ALL
SELECT 'notification_engagement', COUNT(*) FROM notification_engagement WHERE user_id = '764c38af-e49c-4fc0-9584-4cdcbbc3625c' 
UNION ALL
SELECT 'predictive_insights', COUNT(*) FROM predictive_insights WHERE user_id = '764c38af-e49c-4fc0-9584-4cdcbbc3625c'; 