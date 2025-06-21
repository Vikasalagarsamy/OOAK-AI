-- 📸 INSTAGRAM INTEGRATION TABLES - PostgreSQL Migration
-- ======================================================
-- Instagram webhook processing and social media management

-- ============================
-- 1. INSTAGRAM MESSAGES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS instagram_messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE NOT NULL, -- Instagram message ID
    from_user_id VARCHAR(255) NOT NULL, -- Instagram user ID
    to_user_id VARCHAR(255) NOT NULL, -- Recipient Instagram user ID
    content TEXT, -- Message text content
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'voice_note')),
    attachment_metadata JSONB DEFAULT '{}', -- File attachments, URLs, etc.
    is_from_client BOOLEAN DEFAULT true, -- True if from external user
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Instagram timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- 2. INSTAGRAM COMMENTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS instagram_comments (
    id SERIAL PRIMARY KEY,
    comment_id VARCHAR(255) UNIQUE NOT NULL, -- Instagram comment ID
    post_id VARCHAR(255), -- Instagram post ID
    from_user_id VARCHAR(255) NOT NULL, -- Commenter's Instagram user ID
    from_username VARCHAR(255), -- Commenter's Instagram username
    comment_text TEXT, -- Comment content
    parent_comment_id VARCHAR(255), -- For reply comments
    is_from_client BOOLEAN DEFAULT true, -- True if from external user
    metadata JSONB DEFAULT '{}', -- Additional comment metadata
    created_time TIMESTAMP WITH TIME ZONE, -- Instagram comment creation time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- 3. INSTAGRAM MENTIONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS instagram_mentions (
    id SERIAL PRIMARY KEY,
    mention_id VARCHAR(255) UNIQUE NOT NULL, -- Instagram mention ID
    from_user_id VARCHAR(255) NOT NULL, -- User who mentioned us
    from_username VARCHAR(255), -- Username who mentioned us
    mention_text TEXT, -- Text content of the mention
    media_id VARCHAR(255), -- Instagram media ID where mentioned
    permalink VARCHAR(500), -- Link to the post/story
    mention_type VARCHAR(50) DEFAULT 'tag_mention' CHECK (mention_type IN ('tag_mention', 'story_mention', 'comment_mention')),
    metadata JSONB DEFAULT '{}', -- Additional mention metadata
    created_time TIMESTAMP WITH TIME ZONE, -- Instagram mention creation time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- 4. INSTAGRAM STORY MENTIONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS instagram_story_mentions (
    id SERIAL PRIMARY KEY,
    mention_id VARCHAR(255) UNIQUE NOT NULL, -- Instagram story mention ID
    from_user_id VARCHAR(255) NOT NULL, -- User who mentioned us in story
    from_username VARCHAR(255), -- Username who mentioned us
    story_text TEXT, -- Text content in the story
    media_id VARCHAR(255), -- Instagram story media ID
    story_url VARCHAR(500), -- URL to the story (if available)
    metadata JSONB DEFAULT '{}', -- Story metadata
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Story creation time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- 5. INSTAGRAM INTERACTIONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS instagram_interactions (
    id SERIAL PRIMARY KEY,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('reaction', 'like', 'share', 'save', 'view')),
    user_id VARCHAR(255) NOT NULL, -- Instagram user who performed interaction
    target_message_id VARCHAR(255), -- Target message/post ID
    content VARCHAR(255), -- Reaction emoji, etc.
    metadata JSONB DEFAULT '{}', -- Additional interaction data
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Interaction timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- 6. INSTAGRAM ANALYTICS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS instagram_analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL, -- Analytics date
    total_messages INTEGER DEFAULT 0, -- Total DMs received
    total_comments INTEGER DEFAULT 0, -- Total comments on posts
    total_mentions INTEGER DEFAULT 0, -- Total mentions received
    total_story_mentions INTEGER DEFAULT 0, -- Total story mentions
    new_leads_created INTEGER DEFAULT 0, -- Leads created from Instagram
    engagement_rate DECIMAL(5,2) DEFAULT 0.00, -- Overall engagement rate
    response_time_minutes INTEGER DEFAULT 0, -- Average response time
    metadata JSONB DEFAULT '{}', -- Additional analytics data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- ============================
-- INDEXES FOR PERFORMANCE
-- ============================

-- Instagram messages indexes
CREATE INDEX IF NOT EXISTS idx_instagram_messages_from_user_id ON instagram_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_timestamp ON instagram_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_is_from_client ON instagram_messages(is_from_client);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_created_at ON instagram_messages(created_at DESC);

-- Instagram comments indexes
CREATE INDEX IF NOT EXISTS idx_instagram_comments_post_id ON instagram_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_instagram_comments_from_user_id ON instagram_comments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_comments_created_time ON instagram_comments(created_time DESC);

-- Instagram mentions indexes
CREATE INDEX IF NOT EXISTS idx_instagram_mentions_from_user_id ON instagram_mentions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_mentions_mention_type ON instagram_mentions(mention_type);
CREATE INDEX IF NOT EXISTS idx_instagram_mentions_created_time ON instagram_mentions(created_time DESC);

-- Instagram story mentions indexes
CREATE INDEX IF NOT EXISTS idx_instagram_story_mentions_from_user_id ON instagram_story_mentions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_story_mentions_timestamp ON instagram_story_mentions(timestamp DESC);

-- Instagram interactions indexes
CREATE INDEX IF NOT EXISTS idx_instagram_interactions_user_id ON instagram_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_interactions_type ON instagram_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_instagram_interactions_timestamp ON instagram_interactions(timestamp DESC);

-- Instagram analytics indexes
CREATE INDEX IF NOT EXISTS idx_instagram_analytics_date ON instagram_analytics(date DESC);

-- ============================
-- SAMPLE DATA INSERTION
-- ============================

-- Insert sample Instagram messages
INSERT INTO instagram_messages (
    message_id, from_user_id, to_user_id, content, message_type, 
    is_from_client, timestamp
) VALUES 
    ('ig_msg_001', 'user_fashionlover23', 'business_account', 'Hi! I love your recent post about wedding decorations. Do you do destination weddings?', 'text', true, NOW() - INTERVAL '2 hours'),
    ('ig_msg_002', 'user_startup_founder', 'business_account', 'Interested in your social media management services. Can you send me a quote?', 'text', true, NOW() - INTERVAL '4 hours'),
    ('ig_msg_003', 'user_bride_to_be', 'business_account', 'Your portfolio looks amazing! When can we schedule a consultation?', 'text', true, NOW() - INTERVAL '1 day')
ON CONFLICT (message_id) DO NOTHING;

-- Insert sample Instagram comments
INSERT INTO instagram_comments (
    comment_id, post_id, from_user_id, from_username, comment_text, 
    is_from_client, created_time
) VALUES 
    ('comment_001', 'post_12345', 'user_eventplanner', 'eventplanner_pro', 'This is gorgeous! Do you have packages for corporate events?', true, NOW() - INTERVAL '3 hours'),
    ('comment_002', 'post_12346', 'user_wedding_blogger', 'weddingblogger', 'Love this setup! Can I feature this on my blog?', true, NOW() - INTERVAL '5 hours'),
    ('comment_003', 'post_12347', 'user_photographer', 'photo_artist', 'Beautiful work! Would love to collaborate on future projects.', true, NOW() - INTERVAL '1 day')
ON CONFLICT (comment_id) DO NOTHING;

-- Insert sample Instagram mentions
INSERT INTO instagram_mentions (
    mention_id, from_user_id, from_username, mention_text, media_id,
    mention_type, created_time
) VALUES 
    ('mention_001', 'user_influencer', 'lifestyle_influencer', 'Check out this amazing event setup by @yourbusiness!', 'media_789', 'tag_mention', NOW() - INTERVAL '6 hours'),
    ('mention_002', 'user_client_happy', 'happy_client', 'Thank you @yourbusiness for making our wedding perfect!', 'media_790', 'tag_mention', NOW() - INTERVAL '2 days')
ON CONFLICT (mention_id) DO NOTHING;

-- Insert sample Instagram story mentions
INSERT INTO instagram_story_mentions (
    mention_id, from_user_id, from_username, story_text, media_id, timestamp
) VALUES 
    ('story_001', 'user_vendor', 'vendor_partner', 'Great working with @yourbusiness team!', 'story_456', NOW() - INTERVAL '12 hours'),
    ('story_002', 'user_satisfied_client', 'satisfied_client', 'Amazing service from @yourbusiness - highly recommend!', 'story_457', NOW() - INTERVAL '1 day')
ON CONFLICT (mention_id) DO NOTHING;

-- Insert sample Instagram interactions
INSERT INTO instagram_interactions (
    interaction_type, user_id, target_message_id, content, timestamp
) VALUES 
    ('reaction', 'user_fashionlover23', 'ig_msg_001', '❤️', NOW() - INTERVAL '2 hours'),
    ('reaction', 'user_startup_founder', 'ig_msg_002', '👍', NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

-- Initialize Instagram analytics for today
INSERT INTO instagram_analytics (
    date, total_messages, total_comments, total_mentions, 
    total_story_mentions, new_leads_created, engagement_rate
) VALUES 
    (CURRENT_DATE, 3, 3, 2, 2, 2, 85.50)
ON CONFLICT (date) DO UPDATE SET
    total_messages = EXCLUDED.total_messages,
    total_comments = EXCLUDED.total_comments,
    total_mentions = EXCLUDED.total_mentions,
    total_story_mentions = EXCLUDED.total_story_mentions,
    new_leads_created = EXCLUDED.new_leads_created,
    engagement_rate = EXCLUDED.engagement_rate,
    updated_at = NOW();

-- ============================
-- FUNCTIONS FOR ANALYTICS
-- ============================

-- Function to update daily Instagram analytics
CREATE OR REPLACE FUNCTION update_instagram_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO instagram_analytics (
        date, total_messages, total_comments, total_mentions, 
        total_story_mentions, new_leads_created
    )
    SELECT 
        target_date,
        (SELECT COUNT(*) FROM instagram_messages WHERE DATE(created_at) = target_date),
        (SELECT COUNT(*) FROM instagram_comments WHERE DATE(created_at) = target_date),
        (SELECT COUNT(*) FROM instagram_mentions WHERE DATE(created_at) = target_date),
        (SELECT COUNT(*) FROM instagram_story_mentions WHERE DATE(created_at) = target_date),
        (SELECT COUNT(*) FROM leads WHERE DATE(created_at) = target_date AND source = 'Instagram')
    ON CONFLICT (date) DO UPDATE SET
        total_messages = EXCLUDED.total_messages,
        total_comments = EXCLUDED.total_comments,
        total_mentions = EXCLUDED.total_mentions,
        total_story_mentions = EXCLUDED.total_story_mentions,
        new_leads_created = EXCLUDED.new_leads_created,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================
-- SUCCESS MESSAGE
-- ============================
DO $$
BEGIN
    RAISE NOTICE '✅ Instagram tables created successfully!';
    RAISE NOTICE '📸 Tables: instagram_messages, instagram_comments, instagram_mentions, instagram_story_mentions, instagram_interactions, instagram_analytics';
    RAISE NOTICE '📊 Sample data inserted: 3 messages, 3 comments, 2 mentions, 2 story mentions';
    RAISE NOTICE '🔧 Analytics function created: update_instagram_daily_analytics()';
END $$; 