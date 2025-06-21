-- =================================
-- CALL ANALYTICS SYSTEM SCHEMA
-- =================================

-- Call Transcriptions Table
CREATE TABLE IF NOT EXISTS call_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id VARCHAR(255) UNIQUE NOT NULL,
    task_id UUID REFERENCES ai_tasks(id) ON DELETE SET NULL,
    lead_id INTEGER,
    
    -- Call Metadata
    client_name VARCHAR(255) NOT NULL,
    sales_agent VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    recording_url TEXT,
    
    -- Transcription Data
    transcript TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.8,
    language VARCHAR(10) DEFAULT 'en',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Analytics Table
CREATE TABLE IF NOT EXISTS call_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id VARCHAR(255) NOT NULL REFERENCES call_transcriptions(call_id) ON DELETE CASCADE,
    
    -- Sentiment Analysis
    overall_sentiment VARCHAR(20) CHECK (overall_sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_score DECIMAL(3,2) DEFAULT 0, -- -1.0 to 1.0
    client_sentiment VARCHAR(20) CHECK (client_sentiment IN ('positive', 'negative', 'neutral')),
    agent_sentiment VARCHAR(20) CHECK (agent_sentiment IN ('positive', 'negative', 'neutral')),
    
    -- Call Intent & Topics
    call_intent VARCHAR(255),
    key_topics JSONB DEFAULT '[]'::jsonb,
    business_outcomes JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    
    -- Agent Performance Scores (1-10)
    agent_professionalism_score INTEGER CHECK (agent_professionalism_score BETWEEN 1 AND 10),
    agent_responsiveness_score INTEGER CHECK (agent_responsiveness_score BETWEEN 1 AND 10),
    agent_knowledge_score INTEGER CHECK (agent_knowledge_score BETWEEN 1 AND 10),
    agent_closing_effectiveness INTEGER CHECK (agent_closing_effectiveness BETWEEN 1 AND 10),
    
    -- Client Behavior
    client_engagement_level VARCHAR(20) CHECK (client_engagement_level IN ('high', 'medium', 'low')),
    client_interest_level VARCHAR(20) CHECK (client_interest_level IN ('high', 'medium', 'low')),
    client_objection_handling JSONB DEFAULT '[]'::jsonb,
    client_buying_signals JSONB DEFAULT '[]'::jsonb,
    
    -- Compliance & Risk
    forbidden_words_detected JSONB DEFAULT '[]'::jsonb,
    compliance_issues JSONB DEFAULT '[]'::jsonb,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    
    -- Conversation Metrics
    talk_time_ratio DECIMAL(4,2) DEFAULT 1.0, -- agent vs client talk time
    interruptions INTEGER DEFAULT 0,
    silent_periods INTEGER DEFAULT 0,
    call_quality_score DECIMAL(3,1) DEFAULT 7.0,
    
    -- Business Intelligence Flags
    quote_discussed BOOLEAN DEFAULT false,
    budget_mentioned BOOLEAN DEFAULT false,
    timeline_discussed BOOLEAN DEFAULT false,
    next_steps_agreed BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Insights Table (for aggregated business intelligence)
CREATE TABLE IF NOT EXISTS call_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id VARCHAR(255) NOT NULL REFERENCES call_transcriptions(call_id) ON DELETE CASCADE,
    
    -- Sales Performance Insights
    conversion_indicators JSONB DEFAULT '[]'::jsonb,
    objection_patterns JSONB DEFAULT '[]'::jsonb,
    successful_techniques JSONB DEFAULT '[]'::jsonb,
    improvement_areas JSONB DEFAULT '[]'::jsonb,
    
    -- Client Insights
    decision_factors JSONB DEFAULT '[]'::jsonb,
    pain_points JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '[]'::jsonb,
    concerns JSONB DEFAULT '[]'::jsonb,
    
    -- Business Intelligence
    market_trends JSONB DEFAULT '[]'::jsonb,
    competitive_mentions JSONB DEFAULT '[]'::jsonb,
    pricing_feedback JSONB DEFAULT '[]'::jsonb,
    service_feedback JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_call_id ON call_transcriptions(call_id);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_client_name ON call_transcriptions(client_name);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_sales_agent ON call_transcriptions(sales_agent);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_created_at ON call_transcriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_task_id ON call_transcriptions(task_id);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_lead_id ON call_transcriptions(lead_id);

CREATE INDEX IF NOT EXISTS idx_call_analytics_call_id ON call_analytics(call_id);
CREATE INDEX IF NOT EXISTS idx_call_analytics_sentiment ON call_analytics(overall_sentiment);
CREATE INDEX IF NOT EXISTS idx_call_analytics_risk_level ON call_analytics(risk_level);
CREATE INDEX IF NOT EXISTS idx_call_analytics_follow_up ON call_analytics(follow_up_required);
CREATE INDEX IF NOT EXISTS idx_call_analytics_created_at ON call_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_call_insights_call_id ON call_insights(call_id);

-- Views for Easy Querying
CREATE OR REPLACE VIEW call_analytics_summary AS
SELECT 
    ct.id as transcription_id,
    ct.call_id,
    ct.client_name,
    ct.sales_agent,
    ct.phone_number,
    ct.duration,
    ct.confidence_score,
    ct.created_at as call_date,
    
    ca.overall_sentiment,
    ca.sentiment_score,
    ca.client_sentiment,
    ca.agent_sentiment,
    ca.call_intent,
    ca.key_topics,
    ca.business_outcomes,
    ca.action_items,
    
    -- Agent Performance (Combined Score)
    ROUND((ca.agent_professionalism_score + ca.agent_responsiveness_score + 
           ca.agent_knowledge_score + ca.agent_closing_effectiveness) / 4.0, 1) as agent_overall_score,
    
    ca.client_engagement_level,
    ca.client_interest_level,
    ca.client_buying_signals,
    
    ca.risk_level,
    ca.compliance_issues,
    ca.forbidden_words_detected,
    
    ca.talk_time_ratio,
    ca.call_quality_score,
    
    ca.quote_discussed,
    ca.budget_mentioned,
    ca.timeline_discussed,
    ca.next_steps_agreed,
    ca.follow_up_required
    
FROM call_transcriptions ct
LEFT JOIN call_analytics ca ON ct.call_id = ca.call_id;

-- Agent Performance Summary View
CREATE OR REPLACE VIEW agent_performance_summary AS
SELECT 
    ct.sales_agent,
    COUNT(*) as total_calls,
    
    -- Sentiment Metrics
    AVG(ca.sentiment_score) as avg_sentiment_score,
    COUNT(CASE WHEN ca.overall_sentiment = 'positive' THEN 1 END) as positive_calls,
    COUNT(CASE WHEN ca.overall_sentiment = 'negative' THEN 1 END) as negative_calls,
    
    -- Performance Scores
    AVG(ca.agent_professionalism_score) as avg_professionalism,
    AVG(ca.agent_responsiveness_score) as avg_responsiveness,
    AVG(ca.agent_knowledge_score) as avg_knowledge,
    AVG(ca.agent_closing_effectiveness) as avg_closing,
    
    -- Overall Agent Score
    AVG((ca.agent_professionalism_score + ca.agent_responsiveness_score + 
         ca.agent_knowledge_score + ca.agent_closing_effectiveness) / 4.0) as overall_agent_score,
    
    -- Business Outcomes
    COUNT(CASE WHEN ca.quote_discussed THEN 1 END) as quotes_discussed,
    COUNT(CASE WHEN ca.budget_mentioned THEN 1 END) as budgets_mentioned,
    COUNT(CASE WHEN ca.next_steps_agreed THEN 1 END) as next_steps_agreed,
    
    -- Risk Management
    COUNT(CASE WHEN ca.risk_level = 'high' THEN 1 END) as high_risk_calls,
    
    -- Call Quality
    AVG(ca.call_quality_score) as avg_call_quality,
    AVG(ct.duration) as avg_call_duration,
    
    -- Last 30 Days Performance
    COUNT(CASE WHEN ct.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as calls_last_30_days
    
FROM call_transcriptions ct
JOIN call_analytics ca ON ct.call_id = ca.call_id
GROUP BY ct.sales_agent;

-- Client Interaction Summary View
CREATE OR REPLACE VIEW client_interaction_summary AS
SELECT 
    ct.client_name,
    ct.phone_number,
    COUNT(*) as total_calls,
    
    -- Latest Interaction
    MAX(ct.created_at) as last_call_date,
    AVG(ct.duration) as avg_call_duration,
    
    -- Sentiment Tracking
    AVG(ca.sentiment_score) as avg_sentiment_score,
    COUNT(CASE WHEN ca.client_sentiment = 'positive' THEN 1 END) as positive_interactions,
    COUNT(CASE WHEN ca.client_sentiment = 'negative' THEN 1 END) as negative_interactions,
    
    -- Engagement Levels
    AVG(CASE WHEN ca.client_engagement_level = 'high' THEN 3 
             WHEN ca.client_engagement_level = 'medium' THEN 2 
             ELSE 1 END) as avg_engagement_score,
    AVG(CASE WHEN ca.client_interest_level = 'high' THEN 3 
             WHEN ca.client_interest_level = 'medium' THEN 2 
             ELSE 1 END) as avg_interest_score,
    
    -- Business Intelligence
    COUNT(CASE WHEN ca.quote_discussed THEN 1 END) as quotes_discussed,
    COUNT(CASE WHEN ca.budget_mentioned THEN 1 END) as budgets_mentioned,
    COUNT(CASE WHEN ca.timeline_discussed THEN 1 END) as timelines_discussed,
    COUNT(CASE WHEN ca.next_steps_agreed THEN 1 END) as agreements_reached,
    
    -- Conversion Indicators
    CASE 
        WHEN AVG(ca.sentiment_score) > 0.3 AND 
             COUNT(CASE WHEN ca.next_steps_agreed THEN 1 END) > 0 
        THEN 'high'
        WHEN AVG(ca.sentiment_score) > 0 OR 
             COUNT(CASE WHEN ca.quote_discussed THEN 1 END) > 0 
        THEN 'medium'
        ELSE 'low'
    END as conversion_potential
    
FROM call_transcriptions ct
JOIN call_analytics ca ON ct.call_id = ca.call_id
GROUP BY ct.client_name, ct.phone_number;

-- Triggers for Updated Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_call_transcriptions_updated_at 
    BEFORE UPDATE ON call_transcriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_analytics_updated_at 
    BEFORE UPDATE ON call_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_insights_updated_at 
    BEFORE UPDATE ON call_insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Testing (Optional)
/*
INSERT INTO call_transcriptions (call_id, client_name, sales_agent, phone_number, duration, transcript) VALUES
('call_001', 'Priya Sharma', 'Vikas Alagarsamy', '+919876543210', 420, 'Agent: Hello, this is Vikas from OOAK Photography. Thank you for your interest in our wedding photography services. Client: Hi Vikas, I was looking at your website and I''m interested in your wedding packages. Agent: That''s wonderful! May I know when your wedding is planned? Client: It''s in March next year. Agent: Perfect timing! We have some great packages. Our Essential package starts at ₹75,000, Premium at ₹1.25 lakhs, and Luxury at ₹2 lakhs. Which interests you? Client: The Premium package sounds good. What all does it include? Agent: The Premium package includes pre-wedding shoot, wedding day coverage, edited photos, and an album. Would you like me to send you the detailed quotation? Client: Yes, please send it. Agent: I''ll send it today. Can we schedule a call tomorrow to discuss any questions? Client: Sure, that works.'),
('call_002', 'Rajesh Kumar', 'Vikas Alagarsamy', '+919123456789', 180, 'Agent: Hello Rajesh, this is Vikas calling about your photography inquiry. Client: Hi, yes I was interested in engagement photography. Agent: Great! Our engagement shoots start from ₹15,000. When is your engagement? Client: Next month, but I''m not sure about the budget yet. Agent: No problem, we can work within your budget. Let me send you some portfolio samples first. Client: That would be good. Agent: I''ll email them today and follow up next week. Client: Thank you.');
*/ 