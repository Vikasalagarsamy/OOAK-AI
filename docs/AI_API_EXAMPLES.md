# 🤖 AI-Powered Notification API Examples

**Phase 3A Implementation: Smart Timing, Personalization & Predictive Notifications**

## 📋 **Overview**

Your notification system now includes powerful AI features:
- **Smart Timing** - Optimal delivery based on user behavior
- **Personalization** - Dynamic content and channel selection  
- **Predictive Insights** - Proactive notifications and recommendations
- **Engagement Analytics** - Real-time learning and optimization

---

## 🚀 **API Endpoints**

### 1. **AI-Powered Notification Creation**
**`POST /api/notifications/ai`**

Create intelligent notifications with automatic optimization:

```javascript
// Basic AI-enhanced notification
const response = await fetch('/api/notifications/ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    user_id: 'user-123',
    type: 'quotation_update',
    title: 'New quotation ready for review',
    message: 'Your quotation #QT-2024-001 has been updated and is ready for your review.',
    priority: 'medium',
    allow_ai_optimization: true,
    metadata: {
      quotation_id: 'QT-2024-001',
      amount: 15000
    }
  })
});

const result = await response.json();
/*
Response:
{
  "success": true,
  "data": {
    "notification_id": "notif_abc123",
    "scheduled_time": "2024-01-15T14:30:00Z",
    "ai_enhanced": true,
    "ai_insights": {
      "timing_optimization": {
        "optimal_time": "2024-01-15T14:30:00Z",
        "confidence_score": 0.85,
        "reasoning": "Scheduled for 14:00 based on user's peak activity hours (9, 10, 14, 15, 16) and quotation_update notification patterns. Confidence: 85%"
      },
      "personalization": {
        "personalized_title": "📊 New quotation ready for review",
        "estimated_engagement": 0.78,
        "delivery_channel": ["in_app", "push"],
        "urgency_level": 6
      }
    }
  }
}
*/
```

### 2. **Smart Timing Analysis**
**`GET /api/notifications/ai?action=timing&user_id=xxx&type=xxx`**

Get optimal delivery timing for specific notification types:

```javascript
const response = await fetch(
  '/api/notifications/ai?action=timing&user_id=user-123&type=business_update'
);

const timing = await response.json();
/*
Response:
{
  "success": true,
  "data": {
    "optimal_time": "2024-01-15T10:00:00Z",
    "confidence_score": 0.9,
    "reasoning": "Scheduled for 10:00 based on user's peak activity hours and business_update patterns"
  },
  "recommendations": {
    "best_time": "2024-01-15T10:00:00Z",
    "confidence_level": "high",
    "reasoning": "User is most active during business hours with 90% confidence"
  }
}
*/
```

### 3. **Predictive Insights**
**`GET /api/notifications/insights?user_id=xxx&type=predictive`**

Generate AI-powered insights and recommendations:

```javascript
const response = await fetch('/api/notifications/insights?user_id=user-123&type=predictive');
const insights = await response.json();

/*
Response:
{
  "success": true,
  "data": [
    {
      "event_type": "user_inactivity_risk",
      "probability": 0.82,
      "recommended_action": "Send re-engagement notification",
      "trigger_conditions": { "days_inactive": 3 },
      "estimated_impact": 0.8
    },
    {
      "event_type": "upsell_opportunity", 
      "probability": 0.71,
      "recommended_action": "Send feature upgrade notification",
      "trigger_conditions": { "feature_usage_increase": 0.5 },
      "estimated_impact": 75.5
    }
  ],
  "actionable_insights": 2
}
*/
```

### 4. **Engagement Tracking**
**`POST /api/notifications/engagement`**

Track user interactions for AI learning:

```javascript
// Track notification viewed
await fetch('/api/notifications/engagement', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notification_id: 'notif_abc123',
    user_id: 'user-123',
    event_type: 'viewed',
    timestamp: new Date().toISOString(),
    engagement_data: {
      view_duration: 5.2,
      device: 'mobile'
    }
  })
});

// Track notification clicked
await fetch('/api/notifications/engagement', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notification_id: 'notif_abc123',
    user_id: 'user-123',
    event_type: 'clicked',
    engagement_data: {
      click_target: 'view_quotation_button'
    }
  })
});
```

### 5. **User Behavior Analytics**
**`GET /api/notifications/ai?action=behavior&user_id=xxx`**

Get comprehensive user behavior insights:

```javascript
const response = await fetch('/api/notifications/ai?action=behavior&user_id=user-123');
const behavior = await response.json();

/*
Response:
{
  "success": true,
  "data": {
    "behavior": {
      "engagement_score": 0.75,
      "most_active_hours": [9, 10, 14, 15, 16],
      "avg_response_time": 1200,
      "preferred_notification_types": ["quotation_update", "business_update"]
    },
    "engagement": {
      "read_rate": 82.5,
      "total_notifications_received": 45,
      "total_notifications_read": 37
    },
    "ai_profile": {
      "personalization_ready": true,
      "timing_data_available": true,
      "predicted_engagement": 0.75
    }
  }
}
*/
```

### 6. **Automated AI Actions**
**`POST /api/notifications/insights`**

Trigger automated AI-driven notifications:

```javascript
// Auto-generate and act on high-probability insights
const response = await fetch('/api/notifications/insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user-123',
    action: 'generate_and_act'
  })
});

const result = await response.json();
/*
Response:
{
  "success": true,
  "data": {
    "total_insights": 3,
    "acted_insights": 1,
    "actions": [
      {
        "insight": {
          "event_type": "support_need_predicted",
          "probability": 0.89
        },
        "notification_id": "notif_xyz789",
        "action_taken": "notification_created"
      }
    ]
  },
  "message": "Generated 3 insights, acted on 1 high-probability ones"
}
*/
```

---

## 🎯 **Usage Scenarios**

### **Scenario 1: E-commerce Order Updates**
```javascript
// Create smart order notification
const orderNotification = await fetch('/api/notifications/ai', {
  method: 'POST',
  body: JSON.stringify({
    user_id: customer.id,
    type: 'order_update',
    title: 'Your order is ready for pickup!',
    message: 'Order #12345 is packed and ready at our downtown location.',
    priority: 'high',
    allow_ai_optimization: true,
    metadata: {
      order_id: '12345',
      pickup_location: 'downtown',
      estimated_value: 299.99
    }
  })
});

// AI will automatically:
// ✓ Schedule for user's optimal time
// ✓ Personalize title/message
// ✓ Select best delivery channels
// ✓ Set appropriate urgency level
```

### **Scenario 2: SaaS Re-engagement**
```javascript
// Get predictive insights for inactive users
const insights = await fetch('/api/notifications/insights?user_id=user-456&type=predictive');
const inactivityRisk = insights.data.find(i => i.event_type === 'user_inactivity_risk');

if (inactivityRisk && inactivityRisk.probability > 0.7) {
  // Create AI-optimized re-engagement notification
  await fetch('/api/notifications/ai', {
    method: 'POST',
    body: JSON.stringify({
      user_id: 'user-456',
      type: 'marketing',
      title: 'Missing you! Check out our latest features',
      message: 'We\'ve added some exciting new capabilities while you were away.',
      priority: 'medium',
      allow_ai_optimization: true,
      target_engagement_rate: 0.6
    })
  });
}
```

### **Scenario 3: Business Intelligence Alerts**
```javascript
// Smart business alert with performance tracking
const businessAlert = await fetch('/api/notifications/ai', {
  method: 'POST',
  body: JSON.stringify({
    user_id: manager.id,
    type: 'business_update',
    title: 'Quarterly revenue target achieved!',
    message: 'Congratulations! Your team exceeded Q1 revenue targets by 15%.',
    priority: 'medium',
    allow_ai_optimization: true,
    metadata: {
      achievement_type: 'revenue_target',
      percentage: 115,
      quarter: 'Q1-2024'
    }
  })
});

// Track engagement for AI learning
await fetch('/api/notifications/engagement', {
  method: 'POST',
  body: JSON.stringify({
    notification_id: businessAlert.data.notification_id,
    user_id: manager.id,
    event_type: 'delivered'
  })
});
```

---

## 📊 **AI Performance Metrics**

Monitor your AI-powered notification system:

```javascript
// Get comprehensive analytics
const analytics = await fetch('/api/notifications/engagement?user_id=user-123&timeframe=30d');
const performance = await fetch('/api/notifications/insights?user_id=user-123&type=performance');

// Key metrics to track:
// - Engagement rates by notification type
// - Optimal timing accuracy
// - Personalization effectiveness  
// - Predictive insight success rate
// - User satisfaction scores
```

---

## 🔧 **Advanced Configuration**

### **User Preferences Management**
```javascript
// Update AI preferences
await fetch('/api/notifications/ai', {
  method: 'PUT',
  body: JSON.stringify({
    user_id: 'user-123',
    action: 'preferences',
    data: {
      ai_optimization_enabled: true,
      personalization_level: 'high',
      quiet_hours_start: 22,
      quiet_hours_end: 8,
      frequency_limit: 15
    }
  })
});
```

### **Manual Engagement Updates**
```javascript
// Manual engagement score adjustment
await fetch('/api/notifications/ai', {
  method: 'PUT',
  body: JSON.stringify({
    user_id: 'user-123',
    action: 'engagement',
    data: {
      engagement_score: 0.85
    }
  })
});
```

---

## 🎉 **What's Next?**

Your AI-powered notification system is now ready for:

1. **Phase 3B**: Multi-channel delivery (Email, SMS, Push)
2. **Phase 3C**: Rich media templates and interactive notifications  
3. **Phase 3D**: Advanced analytics dashboard
4. **Phase 3E**: Enterprise integrations (CRM, Slack, etc.)

**The AI foundation is complete - your notifications are now intelligent! 🧠✨** 