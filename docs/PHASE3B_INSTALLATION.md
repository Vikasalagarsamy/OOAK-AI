# 🚀 Phase 3B Installation Guide

## Overview
Phase 3B introduces three advanced AI features:
- **A. WhatsApp Integration** 📱
- **B. Advanced Personalization** 🧠  
- **C. Advanced Analytics Dashboard** 📊

## 🗄️ Database Setup

### 1. Apply Schema Changes
```sql
-- Copy and run this in your database console:
-- Or execute: psql -d "your_database_url" -f schemas/phase3b-features.sql

-- 🚀 Phase 3B: Advanced AI Features Database Schema
-- WhatsApp Integration + Personalization + Analytics

-- ============================
-- A. WHATSAPP INTEGRATION TABLES
-- ============================

-- WhatsApp Configuration Table
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_phone_number_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    webhook_verify_token TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Message Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    template_type TEXT NOT NULL CHECK (template_type IN ('notification', 'marketing', 'follow_up', 'reminder')),
    template_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    language_code TEXT DEFAULT 'en',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    ai_optimized BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Message History
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    phone_number TEXT NOT NULL,
    template_id UUID REFERENCES whatsapp_templates(id),
    message_content TEXT NOT NULL,
    message_id TEXT, -- WhatsApp message ID
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    notification_id TEXT REFERENCES notifications(id),
    ai_timing_score DECIMAL(3,2),
    ai_personalization_score DECIMAL(3,2),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================
-- B. ADVANCED PERSONALIZATION TABLES
-- ============================

-- User AI Profile (Enhanced)
CREATE TABLE IF NOT EXISTS user_ai_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    personality_type TEXT DEFAULT 'balanced', -- analytical, creative, balanced, decisive
    communication_style TEXT DEFAULT 'formal', -- formal, casual, friendly, direct
    preferred_content_length TEXT DEFAULT 'medium', -- short, medium, long
    engagement_patterns JSONB DEFAULT '{}',
    response_time_patterns JSONB DEFAULT '{}',
    content_preferences JSONB DEFAULT '{}',
    ai_learning_enabled BOOLEAN DEFAULT true,
    personalization_score DECIMAL(3,2) DEFAULT 0.5,
    last_interaction TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- AI Recommendations Engine
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('content', 'timing', 'channel', 'frequency')),
    recommendation_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    context_data JSONB DEFAULT '{}',
    applied BOOLEAN DEFAULT false,
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Personalization Learning Data
CREATE TABLE IF NOT EXISTS personalization_learning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    interaction_data JSONB NOT NULL,
    outcome_positive BOOLEAN,
    learning_weight DECIMAL(3,2) DEFAULT 1.0,
    context_tags TEXT[] DEFAULT '{}',
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================
-- C. ADVANCED ANALYTICS TABLES
-- ============================

-- Analytics Dashboard Metrics
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('engagement', 'performance', 'user_behavior', 'ai_accuracy')),
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit TEXT DEFAULT 'count',
    dimensions JSONB DEFAULT '{}',
    time_period TEXT NOT NULL CHECK (time_period IN ('hourly', 'daily', 'weekly', 'monthly')),
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User Engagement Analytics
CREATE TABLE IF NOT EXISTS user_engagement_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id TEXT REFERENCES notifications(id),
    engagement_type TEXT NOT NULL CHECK (engagement_type IN ('view', 'click', 'action', 'dismiss', 'share')),
    engagement_value DECIMAL(5,2) DEFAULT 1.0,
    channel TEXT NOT NULL, -- in_app, whatsapp, email
    device_type TEXT,
    time_to_engage INTEGER, -- seconds
    context_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Performance Tracking
CREATE TABLE IF NOT EXISTS ai_performance_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type TEXT NOT NULL CHECK (model_type IN ('timing', 'personalization', 'content', 'channel')),
    prediction_data JSONB NOT NULL,
    actual_outcome JSONB,
    accuracy_score DECIMAL(3,2),
    confidence_score DECIMAL(3,2),
    model_version TEXT DEFAULT 'v1.0',
    feedback_loop_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Real-time Analytics Cache
CREATE TABLE IF NOT EXISTS analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL UNIQUE,
    cache_data JSONB NOT NULL,
    cache_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================
-- INDEXES FOR PERFORMANCE
-- ============================

-- WhatsApp indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);

-- Personalization indexes
CREATE INDEX IF NOT EXISTS idx_user_ai_profiles_user_id ON user_ai_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_personalization_learning_user_id ON personalization_learning(user_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_name_time ON analytics_metrics(metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_engagement_user_id ON user_engagement_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_created_at ON user_engagement_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_performance_model_type ON ai_performance_tracking(model_type);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);

-- ============================
-- SAMPLE DATA FOR TESTING
-- ============================

-- Insert sample WhatsApp template
INSERT INTO whatsapp_templates (template_name, template_type, template_content, variables) VALUES
('quotation_ready', 'notification', 'Hi {{name}}, your quotation #{{quotation_id}} is ready! Click here to view: {{url}}', '["name", "quotation_id", "url"]'),
('follow_up_reminder', 'follow_up', 'Hello {{name}}, this is a friendly reminder about your enquiry. Our team is ready to assist you. Reply STOP to opt out.', '["name"]'),
('payment_received', 'notification', 'Thank you {{name}}! We have received your payment of {{amount}}. Your order will be processed shortly.', '["name", "amount"]');

-- Insert sample AI profile data (adjust UUID to match your user)
INSERT INTO user_ai_profiles (user_id, personality_type, communication_style, preferred_content_length) VALUES
('764c38af-e49c-4fc0-9584-4cdcbbc3625c', 'analytical', 'formal', 'medium');

-- Insert sample analytics metrics
INSERT INTO analytics_metrics (metric_name, metric_type, metric_value, metric_unit, time_period, recorded_at) VALUES
('notification_engagement_rate', 'engagement', 0.85, 'percentage', 'daily', NOW()),
('ai_timing_accuracy', 'ai_accuracy', 0.80, 'percentage', 'daily', NOW()),
('whatsapp_delivery_rate', 'performance', 0.95, 'percentage', 'daily', NOW()),
('user_satisfaction_score', 'user_behavior', 4.2, 'rating', 'daily', NOW());
```

## 📱 WhatsApp Business API Setup

### 1. Get WhatsApp Business Account
1. Visit [Facebook for Developers](https://developers.facebook.com/)
2. Create a new app and select "Business" 
3. Add WhatsApp Business API product
4. Get your:
   - `Business Phone Number ID`
   - `Access Token`
   - Create a `Webhook Verify Token`

### 2. Configure WhatsApp in Database
```sql
INSERT INTO whatsapp_config (
  business_phone_number_id,
  access_token, 
  webhook_verify_token,
  webhook_url,
  is_active
) VALUES (
  'YOUR_PHONE_NUMBER_ID',
  'YOUR_ACCESS_TOKEN',
  'YOUR_VERIFY_TOKEN', 
  'https://yourdomain.com/api/whatsapp/webhook',
  true
);
```

### 3. Environment Variables
Add to your `.env.local`:
```env
# WhatsApp Configuration (optional - can be stored in database)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

## 🎯 Testing the Features

### 1. Access New Admin Dashboards
```
✅ AI Testing Dashboard: http://localhost:3001/admin/ai-testing
✅ Analytics Dashboard: http://localhost:3001/admin/analytics
```

### 2. Test WhatsApp Integration
```bash
# Test sending WhatsApp message
curl -X POST http://localhost:3001/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_JWT_TOKEN" \
  -d '{
    "userId": 1,
    "phoneNumber": "+1234567890",
    "message": "Test WhatsApp message from AI system",
    "notificationId": "optional_notification_id"
  }'
```

### 3. Test AI Personalization
```bash
# Get AI recommendations
curl -X GET "http://localhost:3001/api/notifications/ai?action=personalization&user_id=764c38af-e49c-4fc0-9584-4cdcbbc3625c"
```

### 4. View Analytics
- Navigate to **Admin → Analytics Dashboard**
- See real-time metrics and charts
- Monitor AI performance scores
- Track WhatsApp delivery rates

## 🔧 Configuration Options

### 1. AI Personalization Settings
```sql
-- Update user AI profile
UPDATE user_ai_profiles SET
  personality_type = 'creative',  -- analytical, creative, balanced, decisive
  communication_style = 'casual', -- formal, casual, friendly, direct  
  preferred_content_length = 'short' -- short, medium, long
WHERE user_id = 'your_user_uuid';
```

### 2. WhatsApp Template Management
```sql
-- Add new message template
INSERT INTO whatsapp_templates (template_name, template_type, template_content, variables) VALUES
('custom_reminder', 'reminder', 'Hi {{name}}, this is a custom reminder about {{subject}}', '["name", "subject"]');
```

### 3. Analytics Configuration
```sql
-- Add custom metrics
INSERT INTO analytics_metrics (metric_name, metric_type, metric_value, metric_unit, time_period, recorded_at) VALUES
('custom_engagement_rate', 'engagement', 75.5, 'percentage', 'daily', NOW());
```

## 🚀 Next Steps

### 1. **Test Everything**
- ✅ Database schema applied
- ✅ Admin dashboards accessible
- ✅ WhatsApp API configured  
- ✅ AI features working

### 2. **Customize**
- Modify WhatsApp templates
- Adjust AI personalization rules
- Add custom analytics metrics

### 3. **Monitor**
- Check analytics dashboard daily
- Monitor AI performance scores
- Track WhatsApp delivery rates

## 🎉 **SUCCESS INDICATORS**

### ✅ **Phase 3B Working When:**
- AI Testing Dashboard shows all green tests
- Analytics Dashboard displays real-time metrics  
- WhatsApp messages send successfully
- Personalization confidence > 80%
- All APIs return successful responses

---

## 🆘 **Troubleshooting**

### Database Issues
```bash
# Check table creation
psql -d "your_db_url" -c "\dt whatsapp*"
psql -d "your_db_url" -c "\dt analytics*"
```

### WhatsApp Issues  
- Verify Business Phone Number ID
- Check Access Token validity
- Confirm webhook URL is accessible

### AI Issues
- Ensure user_ai_profiles has data
- Check AI endpoint responses
- Verify confidence scores > 0.5

**Need Help?** Check the AI Testing Dashboard for real-time diagnostics! 