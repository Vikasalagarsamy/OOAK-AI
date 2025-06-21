-- ==================================
-- COMPREHENSIVE CALL ANALYTICS REPORT
-- ==================================

-- 1. ALL CALL TRANSCRIPTIONS SUMMARY
SELECT '=== CALL TRANSCRIPTIONS SUMMARY ===' as section;
SELECT 
    id,
    call_id,
    client_name,
    sales_agent,
    phone_number,
    duration,
    confidence_score,
    LEFT(transcript, 100) || '...' as transcript_preview,
    created_at
FROM call_transcriptions 
ORDER BY created_at DESC;

-- 2. DETAILED CALL ANALYTICS
SELECT '=== DETAILED CALL ANALYTICS ===' as section;
SELECT 
    ca.call_id,
    ct.client_name,
    ct.sales_agent,
    ct.phone_number,
    
    -- Sentiment Analysis
    ca.overall_sentiment,
    ca.sentiment_score,
    ca.client_sentiment,
    ca.agent_sentiment,
    
    -- Call Intent & Business
    ca.call_intent,
    ca.key_topics,
    ca.business_outcomes,
    ca.action_items,
    
    -- Agent Performance Scores (1-10)
    ca.agent_professionalism_score,
    ca.agent_responsiveness_score,
    ca.agent_knowledge_score,
    ca.agent_closing_effectiveness,
    ROUND((ca.agent_professionalism_score + ca.agent_responsiveness_score + 
           ca.agent_knowledge_score + ca.agent_closing_effectiveness) / 4.0, 1) as overall_agent_score,
    
    -- Client Behavior
    ca.client_engagement_level,
    ca.client_interest_level,
    ca.client_buying_signals,
    ca.client_objection_handling,
    
    -- Business Intelligence
    ca.quote_discussed,
    ca.budget_mentioned,
    ca.timeline_discussed,
    ca.next_steps_agreed,
    ca.follow_up_required,
    
    -- Risk & Compliance
    ca.risk_level,
    ca.compliance_issues,
    ca.forbidden_words_detected,
    
    -- Conversation Quality
    ca.talk_time_ratio,
    ca.interruptions,
    ca.call_quality_score,
    
    ca.created_at
FROM call_analytics ca
JOIN call_transcriptions ct ON ca.call_id = ct.call_id
ORDER BY ca.created_at DESC;

-- 3. AGENT PERFORMANCE SUMMARY
SELECT '=== AGENT PERFORMANCE SUMMARY ===' as section;
SELECT 
    ct.sales_agent,
    COUNT(*) as total_calls,
    
    -- Sentiment Metrics
    AVG(ca.sentiment_score) as avg_sentiment_score,
    COUNT(CASE WHEN ca.overall_sentiment = 'positive' THEN 1 END) as positive_calls,
    COUNT(CASE WHEN ca.overall_sentiment = 'negative' THEN 1 END) as negative_calls,
    COUNT(CASE WHEN ca.overall_sentiment = 'neutral' THEN 1 END) as neutral_calls,
    
    -- Performance Scores
    AVG(ca.agent_professionalism_score) as avg_professionalism,
    AVG(ca.agent_responsiveness_score) as avg_responsiveness,
    AVG(ca.agent_knowledge_score) as avg_knowledge,
    AVG(ca.agent_closing_effectiveness) as avg_closing,
    
    -- Overall Score
    AVG((ca.agent_professionalism_score + ca.agent_responsiveness_score + 
         ca.agent_knowledge_score + ca.agent_closing_effectiveness) / 4.0) as overall_agent_score,
    
    -- Business Outcomes
    COUNT(CASE WHEN ca.quote_discussed THEN 1 END) as quotes_discussed,
    COUNT(CASE WHEN ca.budget_mentioned THEN 1 END) as budgets_mentioned,
    COUNT(CASE WHEN ca.next_steps_agreed THEN 1 END) as next_steps_agreed,
    
    -- Quality Metrics
    AVG(ca.call_quality_score) as avg_call_quality,
    AVG(ct.duration) as avg_call_duration,
    
    -- Risk Assessment
    COUNT(CASE WHEN ca.risk_level = 'high' THEN 1 END) as high_risk_calls,
    COUNT(CASE WHEN ca.risk_level = 'medium' THEN 1 END) as medium_risk_calls,
    COUNT(CASE WHEN ca.risk_level = 'low' THEN 1 END) as low_risk_calls
    
FROM call_transcriptions ct
JOIN call_analytics ca ON ct.call_id = ca.call_id
GROUP BY ct.sales_agent
ORDER BY overall_agent_score DESC;

-- 4. CLIENT INTERACTION INSIGHTS
SELECT '=== CLIENT INTERACTION INSIGHTS ===' as section;
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
    
    -- Engagement Analysis
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
    
    -- Conversion Potential Assessment
    CASE 
        WHEN AVG(ca.sentiment_score) > 0.3 AND 
             COUNT(CASE WHEN ca.next_steps_agreed THEN 1 END) > 0 
        THEN 'HIGH'
        WHEN AVG(ca.sentiment_score) > 0 OR 
             COUNT(CASE WHEN ca.quote_discussed THEN 1 END) > 0 
        THEN 'MEDIUM'
        ELSE 'LOW'
    END as conversion_potential
    
FROM call_transcriptions ct
JOIN call_analytics ca ON ct.call_id = ca.call_id
GROUP BY ct.client_name, ct.phone_number
ORDER BY conversion_potential DESC, avg_sentiment_score DESC;

-- 5. BUSINESS INTELLIGENCE SUMMARY
SELECT '=== BUSINESS INTELLIGENCE SUMMARY ===' as section;
SELECT 
    'Total Calls Processed' as metric,
    COUNT(*) as value,
    '' as additional_info
FROM call_transcriptions

UNION ALL

SELECT 
    'Quotes Discussed' as metric,
    COUNT(CASE WHEN ca.quote_discussed THEN 1 END) as value,
    CONCAT(ROUND(COUNT(CASE WHEN ca.quote_discussed THEN 1 END) * 100.0 / COUNT(*), 1), '%') as additional_info
FROM call_analytics ca

UNION ALL

SELECT 
    'Budget Conversations' as metric,
    COUNT(CASE WHEN ca.budget_mentioned THEN 1 END) as value,
    CONCAT(ROUND(COUNT(CASE WHEN ca.budget_mentioned THEN 1 END) * 100.0 / COUNT(*), 1), '%') as additional_info
FROM call_analytics ca

UNION ALL

SELECT 
    'Next Steps Agreed' as metric,
    COUNT(CASE WHEN ca.next_steps_agreed THEN 1 END) as value,
    CONCAT(ROUND(COUNT(CASE WHEN ca.next_steps_agreed THEN 1 END) * 100.0 / COUNT(*), 1), '%') as additional_info
FROM call_analytics ca

UNION ALL

SELECT 
    'Positive Sentiment Calls' as metric,
    COUNT(CASE WHEN ca.overall_sentiment = 'positive' THEN 1 END) as value,
    CONCAT(ROUND(COUNT(CASE WHEN ca.overall_sentiment = 'positive' THEN 1 END) * 100.0 / COUNT(*), 1), '%') as additional_info
FROM call_analytics ca

UNION ALL

SELECT 
    'High Engagement Clients' as metric,
    COUNT(CASE WHEN ca.client_engagement_level = 'high' THEN 1 END) as value,
    CONCAT(ROUND(COUNT(CASE WHEN ca.client_engagement_level = 'high' THEN 1 END) * 100.0 / COUNT(*), 1), '%') as additional_info
FROM call_analytics ca

UNION ALL

SELECT 
    'Average Agent Score' as metric,
    ROUND(AVG((ca.agent_professionalism_score + ca.agent_responsiveness_score + 
              ca.agent_knowledge_score + ca.agent_closing_effectiveness) / 4.0), 1) as value,
    'out of 10' as additional_info
FROM call_analytics ca

UNION ALL

SELECT 
    'Average Call Quality' as metric,
    ROUND(AVG(ca.call_quality_score), 1) as value,
    'out of 10' as additional_info
FROM call_analytics ca

UNION ALL

SELECT 
    'Follow-ups Required' as metric,
    COUNT(CASE WHEN ca.follow_up_required THEN 1 END) as value,
    CONCAT(ROUND(COUNT(CASE WHEN ca.follow_up_required THEN 1 END) * 100.0 / COUNT(*), 1), '%') as additional_info
FROM call_analytics ca;

-- 6. RECENT ANALYTICS INSIGHTS
SELECT '=== RECENT ANALYTICS INSIGHTS ===' as section;
SELECT 
    ca.call_id,
    ct.client_name,
    ct.sales_agent,
    ca.overall_sentiment,
    ca.sentiment_score,
    ROUND((ca.agent_professionalism_score + ca.agent_responsiveness_score + 
           ca.agent_knowledge_score + ca.agent_closing_effectiveness) / 4.0, 1) as agent_score,
    ca.client_engagement_level,
    ca.quote_discussed,
    ca.next_steps_agreed,
    ca.follow_up_required,
    ca.key_topics,
    ca.business_outcomes,
    ca.action_items,
    ca.created_at
FROM call_analytics ca
JOIN call_transcriptions ct ON ca.call_id = ct.call_id
ORDER BY ca.created_at DESC
LIMIT 10;

-- 7. CALL INSIGHTS (if table exists)
SELECT '=== ADVANCED CALL INSIGHTS ===' as section;
SELECT 
    ci.call_id,
    ct.client_name,
    ci.conversion_indicators,
    ci.objection_patterns,
    ci.successful_techniques,
    ci.improvement_areas,
    ci.decision_factors,
    ci.pain_points,
    ci.competitive_mentions,
    ci.pricing_feedback,
    ci.created_at
FROM call_insights ci
JOIN call_transcriptions ct ON ci.call_id = ct.call_id
ORDER BY ci.created_at DESC; 