# 🧪 AI Notification System Testing Guide

**Complete guide to test your AI-powered notification system**

## 📋 **Quick Start Testing**

### **Prerequisites**
1. ✅ Database schema deployed (AI tables created)
2. ✅ Next.js app running (`npm run dev`)
3. ✅ Environment variables configured
4. ✅ At least one test user in Supabase Auth

### **Step 1: Basic Setup Check**
```bash
# Make sure your app is running
npm run dev

# Verify database connection
# Check Supabase dashboard - all AI tables should exist
```

### **Step 2: Get a Test User Token**
```javascript
// In your browser console or test file:
const { data } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'your-password'
});
console.log('User token:', data.session.access_token);
```

### **Step 3: Run Automated Tests**
```bash
# Option 1: Node.js (install node-fetch first)
npm install node-fetch
node scripts/test-ai-notifications.js

# Option 2: Browser (open test page)
# Create test-page.html (see below)
```

---

## 🚀 **Testing Methods**

### **Method 1: Automated Test Suite**
Use the comprehensive test script:

```bash
# Update the config in scripts/test-ai-notifications.js
# Set your actual user_id and auth_token
node scripts/test-ai-notifications.js
```

**Expected Output:**
```
🚀 Starting AI Notification System Test Suite...
🧠 Testing AI Notification Creation...
✅ PASS: Create quotation_update notification
✅ PASS: Notification ID returned
⏰ Testing Smart Timing Analysis...
✅ PASS: Quotation timing optimization
📊 Testing Engagement Tracking...
✅ PASS: Track delivered engagement
🔮 Testing Predictive Insights...
...
📊 Test Results Summary:
✅ Passed: 45
❌ Failed: 0
📈 Success Rate: 100.0%
🎉 All tests passed!
```

### **Method 2: Manual API Testing**
Test individual endpoints manually:

#### **🧠 Create AI Notification**
```bash
curl -X POST http://localhost:3000/api/notifications/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "your-user-id", 
    "type": "quotation_update",
    "title": "Test Quotation Ready",
    "message": "Your quotation is ready for review.",
    "priority": "medium",
    "allow_ai_optimization": true
  }'
```

#### **⏰ Get Smart Timing**
```bash
curl "http://localhost:3000/api/notifications/ai?action=timing&user_id=your-user-id&type=quotation_update"
```

#### **📊 Track Engagement**
```bash
curl -X POST http://localhost:3000/api/notifications/engagement \
  -H "Content-Type: application/json" \
  -d '{
    "notification_id": "notification-id-from-above",
    "user_id": "your-user-id",
    "event_type": "viewed"
  }'
```

### **Method 3: Browser Testing Page**
Create a simple HTML test page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Notification Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        button { margin: 5px; padding: 10px; }
        .result { background: #f5f5f5; padding: 10px; margin: 10px 0; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>🧪 AI Notification System Test</h1>
    
    <!-- Configuration -->
    <div class="test-section">
        <h3>📋 Configuration</h3>
        <input type="text" id="userId" placeholder="User ID" value="test-user-123">
        <input type="text" id="authToken" placeholder="Auth Token">
        <button onclick="saveConfig()">Save Config</button>
    </div>

    <!-- Test AI Notification -->
    <div class="test-section">
        <h3>🧠 Test AI Notification Creation</h3>
        <button onclick="testAINotification()">Create AI Notification</button>
        <div id="aiResult" class="result"></div>
    </div>

    <!-- Test Smart Timing -->
    <div class="test-section">
        <h3>⏰ Test Smart Timing</h3>
        <button onclick="testSmartTiming()">Get Optimal Timing</button>
        <div id="timingResult" class="result"></div>
    </div>

    <!-- Test Insights -->
    <div class="test-section">
        <h3>🔮 Test Predictive Insights</h3>
        <button onclick="testInsights()">Generate Insights</button>
        <div id="insightsResult" class="result"></div>
    </div>

    <script>
        let config = { userId: '', authToken: '' };

        function saveConfig() {
            config.userId = document.getElementById('userId').value;
            config.authToken = document.getElementById('authToken').value;
            console.log('Config saved:', config);
        }

        async function makeRequest(endpoint, options = {}) {
            const url = `http://localhost:3000/api/notifications${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.authToken}`,
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            return { success: response.ok, data, status: response.status };
        }

        async function testAINotification() {
            const result = await makeRequest('/ai', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: config.userId,
                    type: 'test_notification',
                    title: 'Browser Test Notification',
                    message: 'Testing AI notification from browser',
                    priority: 'medium',
                    allow_ai_optimization: true
                })
            });

            const resultDiv = document.getElementById('aiResult');
            if (result.success) {
                resultDiv.innerHTML = `
                    <div class="success">✅ Success!</div>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="error">❌ Error: ${result.data.error}</div>
                `;
            }
        }

        async function testSmartTiming() {
            const result = await makeRequest(`/ai?action=timing&user_id=${config.userId}&type=test_notification`);

            const resultDiv = document.getElementById('timingResult');
            if (result.success) {
                resultDiv.innerHTML = `
                    <div class="success">✅ Success!</div>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="error">❌ Error: ${result.data.error}</div>
                `;
            }
        }

        async function testInsights() {
            const result = await makeRequest(`/insights?user_id=${config.userId}&type=predictive`);

            const resultDiv = document.getElementById('insightsResult');
            if (result.success) {
                resultDiv.innerHTML = `
                    <div class="success">✅ Success!</div>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="error">❌ Error: ${result.data.error}</div>
                `;
            }
        }
    </script>
</body>
</html>
```

---

## 📊 **Database Testing**

### **Check AI Tables**
```sql
-- Verify all AI tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%behavior%' 
OR table_name LIKE '%insight%' 
OR table_name LIKE '%engagement%';

-- Check user behavior data
SELECT * FROM user_behavior_analytics LIMIT 5;

-- Check notification engagement
SELECT * FROM notification_engagement LIMIT 5;

-- Check predictive insights
SELECT * FROM predictive_insights LIMIT 5;
```

### **Sample Data Creation**
```sql
-- Insert test user behavior data
INSERT INTO user_behavior_analytics (user_id, engagement_score, most_active_hours)
VALUES ('test-user-123', 0.75, ARRAY[9, 10, 14, 15, 16]);

-- Insert test notification patterns
INSERT INTO notification_patterns (type, optimal_hours, avg_response_time)
VALUES ('quotation_update', ARRAY[10, 14, 16], 1800);
```

---

## 🔍 **What to Test**

### **✅ AI Features Checklist**

#### **Smart Timing**
- [ ] Optimal time calculation
- [ ] Confidence score generation
- [ ] User activity pattern analysis
- [ ] Timezone handling
- [ ] Notification type patterns

#### **Personalization**
- [ ] Dynamic title generation
- [ ] Personalized message content
- [ ] Channel selection optimization
- [ ] Urgency level calculation
- [ ] Emoji addition

#### **Predictive Insights**
- [ ] User inactivity risk detection
- [ ] Upsell opportunity identification
- [ ] Support need prediction
- [ ] Insight probability scoring
- [ ] Automated action triggering

#### **Engagement Tracking**
- [ ] Event recording (delivered, viewed, clicked)
- [ ] Response time calculation
- [ ] Duplicate prevention
- [ ] Analytics generation
- [ ] Behavior score updates

### **🛡️ Error Handling Tests**

#### **Rate Limiting**
```javascript
// Test rate limits (20 requests/minute)
for (let i = 0; i < 25; i++) {
  // Make rapid requests - should see 429 errors
}
```

#### **Validation Tests**
```javascript
// Test missing required fields
await fetch('/api/notifications/ai', {
  method: 'POST',
  body: JSON.stringify({ /* missing user_id */ })
});
// Should return 400 error
```

#### **Authentication Tests**
```javascript
// Test without auth token
await fetch('/api/notifications/ai', {
  method: 'POST'
  // No Authorization header
});
// Should return 401 error
```

---

## 🎯 **Expected Test Results**

### **Successful AI Notification Creation**
```json
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
        "reasoning": "Scheduled based on user activity patterns"
      },
      "personalization": {
        "personalized_title": "📊 Test Notification Ready",
        "estimated_engagement": 0.78,
        "delivery_channel": ["in_app", "push"],
        "urgency_level": 6
      }
    }
  }
}
```

### **Smart Timing Response**
```json
{
  "success": true,
  "data": {
    "optimal_time": "2024-01-15T10:00:00Z",
    "confidence_score": 0.9,
    "reasoning": "User most active at 10:00 AM based on historical data"
  },
  "recommendations": {
    "best_time": "2024-01-15T10:00:00Z",
    "confidence_level": "high"
  }
}
```

### **Predictive Insights Response**
```json
{
  "success": true,
  "data": [
    {
      "event_type": "user_inactivity_risk",
      "probability": 0.82,
      "recommended_action": "Send re-engagement notification",
      "trigger_conditions": { "days_inactive": 3 },
      "estimated_impact": 0.8
    }
  ],
  "actionable_insights": 1
}
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"User not found" Error**
- Verify user exists in Supabase Auth
- Check user_id format (UUID vs string)
- Ensure auth token is valid

#### **"Rate limit exceeded" Error**
- Wait 1 minute between test runs
- Check rate limiting logic in API

#### **Database Connection Errors**
- Verify SUPABASE_SERVICE_ROLE_KEY
- Check database permissions
- Ensure AI tables are created

#### **AI Features Not Working**
- Check if user has behavior data
- Verify notification patterns exist
- Ensure proper foreign key relationships

### **Debug Commands**
```bash
# Check Next.js logs
npm run dev

# Check database connectivity
npx supabase status

# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

---

## 🎉 **Success Indicators**

Your AI notification system is working correctly when:

✅ **Smart notifications are created** with AI enhancements  
✅ **Optimal timing is calculated** with confidence scores  
✅ **Personalization is applied** (titles, messages, channels)  
✅ **Engagement is tracked** and behavior scores update  
✅ **Predictive insights are generated** with actionable recommendations  
✅ **Rate limiting is enforced** properly  
✅ **Database records are created** in all AI tables  
✅ **Error handling works** for invalid requests  

**🎊 Congratulations! Your AI-powered notification system is fully functional!** 