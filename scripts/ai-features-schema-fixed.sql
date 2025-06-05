-- 🤖 FIXED AI-Powered Notification Features Database Schema
-- Handles notifications.id as TEXT type (not UUID)

-- User Behavior Analytics Table
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    most_active_hours INTEGER[] DEFAULT ARRAY[9,10,14,15,16],
    avg_response_time INTEGER DEFAULT 1800, -- seconds
    preferred_notification_types TEXT[] DEFAULT ARRAY['system'],
    engagement_score DECIMAL(3,2) DEFAULT 0.5 CHECK (engagement_score >= 0 AND engagement_score <= 1),
    timezone TEXT DEFAULT 'UTC',
    device_types TEXT[] DEFAULT ARRAY['web'],
    last_activity TIMESTAMPTZ DEFAULT now(),
    total_notifications_received INTEGER DEFAULT 0,
    total_notifications_read INTEGER DEFAULT 0,
    average_read_time INTEGER DEFAULT 0, -- seconds
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Notification Patterns Table
CREATE TABLE IF NOT EXISTS notification_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    engagement_rate DECIMAL(3,2) DEFAULT 0.5,
    optimal_timing INTEGER[] DEFAULT ARRAY[9,14,16],
    user_segments TEXT[] DEFAULT ARRAY['general'],
    success_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(type)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    include_name BOOLEAN DEFAULT false,
    channel_preferences TEXT[] DEFAULT ARRAY['in_app'],
    quiet_hours_start INTEGER DEFAULT 22, -- 10 PM
    quiet_hours_end INTEGER DEFAULT 8,    -- 8 AM
    frequency_limit INTEGER DEFAULT 10,   -- max notifications per day
    ai_optimization_enabled BOOLEAN DEFAULT true,
    personalization_level TEXT DEFAULT 'medium' CHECK (personalization_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- User Activity History Table
CREATE TABLE IF NOT EXISTS user_activity_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_data JSONB DEFAULT '{}',
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Decision Log Table (FIXED - notification_id as TEXT)
CREATE TABLE IF NOT EXISTS ai_decision_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id TEXT REFERENCES notifications(id) ON DELETE CASCADE, -- Changed from UUID to TEXT
    decision_type TEXT NOT NULL,
    decision_data JSONB NOT NULL,
    model_version TEXT DEFAULT 'v1.0',
    confidence_score DECIMAL(3,2),
    execution_time INTEGER, -- milliseconds
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Engagement Table (FIXED - notification_id as TEXT)
CREATE TABLE IF NOT EXISTS notification_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE, -- Changed from UUID to TEXT
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('delivered', 'viewed', 'clicked', 'dismissed')),
    engagement_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Predictive Insights Table
CREATE TABLE IF NOT EXISTS predictive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    probability DECIMAL(3,2) NOT NULL CHECK (probability >= 0 AND probability <= 1),
    recommended_action TEXT NOT NULL,
    trigger_conditions JSONB DEFAULT '{}',
    estimated_impact DECIMAL(3,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'triggered', 'completed', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add scheduled_for column to notifications table (if not exists)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT now();

-- Add AI enhancement fields to notifications metadata
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS ai_enhanced BOOLEAN DEFAULT false;

-- Notification Performance Metrics View
CREATE OR REPLACE VIEW notification_performance_metrics AS
SELECT 
    n.type,
    n.priority,
    COUNT(*) as total_sent,
    COUNT(CASE WHEN ne.event_type = 'viewed' THEN 1 END) as total_viewed,
    COUNT(CASE WHEN ne.event_type = 'clicked' THEN 1 END) as total_clicked,
    COUNT(CASE WHEN ne.event_type = 'dismissed' THEN 1 END) as total_dismissed,
    ROUND(
        COUNT(CASE WHEN ne.event_type = 'viewed' THEN 1 END)::decimal / COUNT(*) * 100, 2
    ) as view_rate,
    ROUND(
        COUNT(CASE WHEN ne.event_type = 'clicked' THEN 1 END)::decimal / COUNT(*) * 100, 2
    ) as click_rate,
    AVG(EXTRACT(EPOCH FROM (ne.created_at - n.created_at))) as avg_response_time
FROM notifications n
LEFT JOIN notification_engagement ne ON n.id = ne.notification_id
WHERE n.created_at >= now() - INTERVAL '30 days'
GROUP BY n.type, n.priority;

-- User Engagement Summary View
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
    uba.user_id,
    uba.engagement_score,
    uba.total_notifications_received,
    uba.total_notifications_read,
    ROUND(
        CASE 
            WHEN uba.total_notifications_received > 0 
            THEN uba.total_notifications_read::decimal / uba.total_notifications_received * 100
            ELSE 0 
        END, 2
    ) as read_rate,
    uba.avg_response_time,
    uba.most_active_hours,
    uba.last_activity
FROM user_behavior_analytics uba;

-- AI Insights Summary View
CREATE OR REPLACE VIEW ai_insights_summary AS
SELECT 
    pi.user_id,
    pi.insight_type,
    pi.probability,
    pi.recommended_action,
    pi.status,
    pi.created_at,
    pi.expires_at,
    CASE 
        WHEN pi.expires_at < now() THEN true 
        ELSE false 
    END as is_expired
FROM predictive_insights pi
WHERE pi.status != 'expired'
ORDER BY pi.probability DESC, pi.created_at DESC;

-- Indexes for AI feature performance
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_user_id 
ON user_behavior_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_engagement 
ON user_behavior_analytics(engagement_score DESC);

CREATE INDEX IF NOT EXISTS idx_notification_patterns_type 
ON notification_patterns(type);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_history_user_id_created 
ON user_activity_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_decision_log_notification_id 
ON ai_decision_log(notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_engagement_notification_id 
ON notification_engagement(notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_engagement_user_event 
ON notification_engagement(user_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_predictive_insights_user_status 
ON predictive_insights(user_id, status);

CREATE INDEX IF NOT EXISTS idx_predictive_insights_probability 
ON predictive_insights(probability DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for 
ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Functions for AI feature automation

-- Function to update user engagement score
CREATE OR REPLACE FUNCTION update_user_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Update engagement score based on notification interaction
    UPDATE user_behavior_analytics 
    SET 
        engagement_score = LEAST(1.0, GREATEST(0.0, 
            CASE 
                WHEN NEW.event_type = 'clicked' THEN engagement_score + 0.1
                WHEN NEW.event_type = 'viewed' THEN engagement_score + 0.05
                WHEN NEW.event_type = 'dismissed' THEN engagement_score - 0.02
                ELSE engagement_score
            END
        )),
        updated_at = now()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to track user activity patterns
CREATE OR REPLACE FUNCTION track_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update most active hours based on activity time
    UPDATE user_behavior_analytics 
    SET 
        most_active_hours = array_append(
            most_active_hours, 
            EXTRACT(HOUR FROM NEW.created_at)::INTEGER
        ),
        last_activity = NEW.created_at,
        updated_at = now()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old predictive insights
CREATE OR REPLACE FUNCTION expire_old_insights()
RETURNS void AS $$
BEGIN
    UPDATE predictive_insights 
    SET 
        status = 'expired',
        updated_at = now()
    WHERE expires_at < now() 
    AND status != 'expired';
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE OR REPLACE TRIGGER trigger_update_engagement_score
    AFTER INSERT ON notification_engagement
    FOR EACH ROW
    EXECUTE FUNCTION update_user_engagement_score();

CREATE OR REPLACE TRIGGER trigger_track_user_activity
    AFTER INSERT ON user_activity_history
    FOR EACH ROW
    EXECUTE FUNCTION track_user_activity();

-- Insert default notification patterns
INSERT INTO notification_patterns (type, optimal_timing, engagement_rate, user_segments) VALUES
('system', ARRAY[9,11,14,16], 0.7, ARRAY['all_users']),
('business_update', ARRAY[10,14,15], 0.6, ARRAY['business_users']),
('security_alert', ARRAY[9,10,11,12,13,14,15,16,17], 0.9, ARRAY['all_users']),
('quotation_update', ARRAY[9,10,11,14,15,16], 0.8, ARRAY['sales_users']),
('marketing', ARRAY[10,14,18], 0.4, ARRAY['marketing_segment']),
('feature_announcement', ARRAY[10,15], 0.5, ARRAY['active_users'])
ON CONFLICT (type) DO UPDATE SET
    optimal_timing = EXCLUDED.optimal_timing,
    engagement_rate = EXCLUDED.engagement_rate,
    user_segments = EXCLUDED.user_segments,
    updated_at = now();

-- Enable Row Level Security
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_engagement ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI features
CREATE POLICY "Users can view their own behavior analytics" ON user_behavior_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own behavior analytics" ON user_behavior_analytics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity history" ON user_activity_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own predictive insights" ON predictive_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own engagement data" ON notification_engagement
    FOR SELECT USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can access all AI data" ON user_behavior_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Analyze tables for better performance
ANALYZE user_behavior_analytics;
ANALYZE notification_patterns;
ANALYZE user_preferences;

SELECT 'FIXED AI features schema setup complete! 🤖✨' as status; 