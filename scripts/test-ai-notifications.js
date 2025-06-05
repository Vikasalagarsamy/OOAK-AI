/**
 * 🧪 AI Notification System Test Suite
 * 
 * This script tests all AI-powered notification features:
 * - Smart notification creation
 * - Engagement tracking
 * - Predictive insights
 * - User behavior analytics
 * - Database operations
 */

const API_BASE = 'http://localhost:3000/api/notifications';

// Test configuration
const TEST_CONFIG = {
  user_id: 'test-user-123',
  auth_token: 'your-test-token-here', // Replace with actual token
  test_timeout: 30000 // 30 seconds
};

// Test data
const TEST_NOTIFICATIONS = [
  {
    type: 'quotation_update',
    title: 'Test Quotation Ready',
    message: 'Your test quotation #QT-TEST-001 is ready for review.',
    priority: 'medium',
    metadata: { quotation_id: 'QT-TEST-001', amount: 5000 }
  },
  {
    type: 'business_update', 
    title: 'Test Business Alert',
    message: 'Important business update for testing.',
    priority: 'high',
    metadata: { department: 'sales', urgency: 'high' }
  },
  {
    type: 'marketing',
    title: 'Test Marketing Message',
    message: 'Check out our latest features!',
    priority: 'low',
    metadata: { campaign: 'test-campaign' }
  }
];

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * 🔧 Utility Functions
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
}

function assert(condition, message) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    log(`✅ PASS: ${message}`, 'success');
  } else {
    testResults.failed++;
    log(`❌ FAIL: ${message}`, 'error');
    testResults.details.push(`FAILED: ${message}`);
  }
}

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.auth_token}`,
      ...options.headers
    },
    ...options
  };

  log(`📡 Making ${config.method || 'GET'} request to: ${url}`, 'info');
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || data.message}`);
    }
    
    return { success: true, data, status: response.status };
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * 🧪 Test Suite Functions
 */

// Test 1: AI Notification Creation
async function testAINotificationCreation() {
  log('\n🧠 Testing AI Notification Creation...', 'info');
  
  for (const notificationData of TEST_NOTIFICATIONS) {
    const result = await makeRequest('/ai', {
      method: 'POST',
      body: JSON.stringify({
        user_id: TEST_CONFIG.user_id,
        allow_ai_optimization: true,
        ...notificationData
      })
    });

    assert(result.success, `Create ${notificationData.type} notification`);
    
    if (result.success) {
      const { data } = result;
      assert(data.notification_id, 'Notification ID returned');
      assert(data.scheduled_time, 'Scheduled time calculated');
      assert(data.ai_enhanced !== undefined, 'AI enhancement flag present');
      assert(data.ai_insights, 'AI insights included');
      
      if (data.ai_insights?.timing_optimization) {
        assert(data.ai_insights.timing_optimization.confidence_score >= 0, 'Timing confidence score valid');
        assert(data.ai_insights.timing_optimization.reasoning, 'Timing reasoning provided');
      }
      
      if (data.ai_insights?.personalization) {
        assert(data.ai_insights.personalization.estimated_engagement >= 0, 'Engagement estimate valid');
        assert(data.ai_insights.personalization.delivery_channel, 'Delivery channels suggested');
      }
      
      // Store notification ID for later tests
      TEST_CONFIG[`${notificationData.type}_notification_id`] = data.notification_id;
    }
  }
}

// Test 2: Smart Timing Analysis
async function testSmartTiming() {
  log('\n⏰ Testing Smart Timing Analysis...', 'info');
  
  const timingTests = [
    { type: 'quotation_update', description: 'Quotation timing optimization' },
    { type: 'business_update', description: 'Business update timing optimization' },
    { type: 'marketing', description: 'Marketing timing optimization' }
  ];

  for (const test of timingTests) {
    const result = await makeRequest(`/ai?action=timing&user_id=${TEST_CONFIG.user_id}&type=${test.type}`);
    
    assert(result.success, test.description);
    
    if (result.success) {
      const { data } = result;
      assert(data.optimal_time, 'Optimal time calculated');
      assert(data.confidence_score >= 0 && data.confidence_score <= 1, 'Confidence score in valid range');
      assert(data.reasoning, 'Timing reasoning provided');
    }
  }
}

// Test 3: Engagement Tracking
async function testEngagementTracking() {
  log('\n📊 Testing Engagement Tracking...', 'info');
  
  const engagementEvents = ['delivered', 'viewed', 'clicked'];
  const notificationId = TEST_CONFIG.quotation_update_notification_id;
  
  if (!notificationId) {
    log('⚠️ Skipping engagement tests - no notification ID available', 'warning');
    return;
  }

  for (const eventType of engagementEvents) {
    const result = await makeRequest('/engagement', {
      method: 'POST',
      body: JSON.stringify({
        notification_id: notificationId,
        user_id: TEST_CONFIG.user_id,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        engagement_data: {
          test_event: true,
          event_sequence: engagementEvents.indexOf(eventType) + 1
        }
      })
    });

    assert(result.success, `Track ${eventType} engagement`);
    
    if (result.success) {
      const { data } = result;
      assert(data.engagement_id, 'Engagement ID returned');
      assert(data.event_type === eventType, 'Event type matches');
      assert(data.response_time_seconds >= 0, 'Response time calculated');
    }
  }
}

// Test 4: Predictive Insights
async function testPredictiveInsights() {
  log('\n🔮 Testing Predictive Insights...', 'info');
  
  const insightTypes = ['predictive', 'stored', 'performance', 'user_behavior', 'all'];
  
  for (const type of insightTypes) {
    const result = await makeRequest(`/insights?user_id=${TEST_CONFIG.user_id}&type=${type}`);
    
    assert(result.success, `Get ${type} insights`);
    
    if (result.success) {
      const { data } = result;
      
      if (type === 'predictive') {
        assert(Array.isArray(data), 'Predictive insights are array');
        if (data.length > 0) {
          const insight = data[0];
          assert(insight.event_type, 'Insight has event type');
          assert(insight.probability >= 0 && insight.probability <= 1, 'Probability in valid range');
          assert(insight.recommended_action, 'Recommended action provided');
        }
      }
      
      if (type === 'user_behavior') {
        assert(data.engagement_level, 'Engagement level categorized');
        assert(data.recommendations, 'Behavior recommendations provided');
      }
    }
  }
}

// Test 5: User Behavior Analytics
async function testUserBehaviorAnalytics() {
  log('\n📈 Testing User Behavior Analytics...', 'info');
  
  const result = await makeRequest(`/ai?action=behavior&user_id=${TEST_CONFIG.user_id}`);
  
  assert(result.success, 'Get user behavior analytics');
  
  if (result.success) {
    const { data } = result;
    assert(data.behavior, 'Behavior data present');
    assert(data.engagement, 'Engagement data present');
    assert(data.ai_profile, 'AI profile present');
    
    if (data.ai_profile) {
      assert(typeof data.ai_profile.personalization_ready === 'boolean', 'Personalization readiness flag');
      assert(typeof data.ai_profile.timing_data_available === 'boolean', 'Timing data availability flag');
      assert(data.ai_profile.predicted_engagement >= 0, 'Predicted engagement score');
    }
  }
}

// Test 6: Engagement Analytics
async function testEngagementAnalytics() {
  log('\n📊 Testing Engagement Analytics...', 'info');
  
  const timeframes = ['1d', '7d', '30d'];
  
  for (const timeframe of timeframes) {
    const result = await makeRequest(`/engagement?user_id=${TEST_CONFIG.user_id}&timeframe=${timeframe}`);
    
    assert(result.success, `Get ${timeframe} engagement analytics`);
    
    if (result.success) {
      const { data } = result;
      assert(data.total_engagements >= 0, 'Total engagements count');
      assert(data.by_event_type, 'Engagement breakdown by event type');
      assert(data.engagement_rate >= 0, 'Engagement rate calculated');
      assert(data.trends, 'Engagement trends data');
    }
  }
}

// Test 7: AI Preferences Management
async function testAIPreferences() {
  log('\n⚙️ Testing AI Preferences Management...', 'info');
  
  const preferenceUpdates = [
    {
      action: 'preferences',
      data: {
        ai_optimization_enabled: true,
        personalization_level: 'high',
        quiet_hours_start: 22,
        quiet_hours_end: 8,
        frequency_limit: 10
      },
      description: 'Update user preferences'
    },
    {
      action: 'engagement',
      data: { engagement_score: 0.75 },
      description: 'Update engagement score'
    },
    {
      action: 'activity',
      data: {
        activity_type: 'test_activity',
        activity_data: { test: true, timestamp: new Date().toISOString() }
      },
      description: 'Log user activity'
    }
  ];

  for (const update of preferenceUpdates) {
    const result = await makeRequest('/ai', {
      method: 'PUT',
      body: JSON.stringify({
        user_id: TEST_CONFIG.user_id,
        action: update.action,
        data: update.data
      })
    });

    assert(result.success, update.description);
  }
}

// Test 8: Automated AI Actions
async function testAutomatedActions() {
  log('\n🤖 Testing Automated AI Actions...', 'info');
  
  const actions = [
    { action: 'generate_and_act', description: 'Generate and act on insights' },
    { action: 'cleanup_expired', description: 'Cleanup expired insights' }
  ];

  for (const actionTest of actions) {
    const result = await makeRequest('/insights', {
      method: 'POST',
      body: JSON.stringify({
        user_id: TEST_CONFIG.user_id,
        action: actionTest.action
      })
    });

    assert(result.success, actionTest.description);
    
    if (result.success && actionTest.action === 'generate_and_act') {
      const { data } = result;
      assert(data.total_insights >= 0, 'Total insights count');
      assert(data.acted_insights >= 0, 'Acted insights count');
    }
  }
}

// Test 9: Rate Limiting
async function testRateLimiting() {
  log('\n🚦 Testing Rate Limiting...', 'info');
  
  // Make multiple requests quickly to test rate limiting
  const rapidRequests = Array(5).fill().map(() => 
    makeRequest('/ai', {
      method: 'POST',
      body: JSON.stringify({
        user_id: TEST_CONFIG.user_id,
        type: 'test_rate_limit',
        title: 'Rate limit test',
        message: 'Testing rate limiting functionality'
      })
    })
  );

  const results = await Promise.all(rapidRequests);
  const successCount = results.filter(r => r.success).length;
  
  assert(successCount > 0, 'Some requests succeeded');
  log(`📊 Rate limiting test: ${successCount}/5 requests succeeded`, 'info');
}

/**
 * 🏁 Main Test Runner
 */
async function runAllTests() {
  log('🚀 Starting AI Notification System Test Suite...', 'info');
  log(`📋 Test Configuration:`, 'info');
  log(`   User ID: ${TEST_CONFIG.user_id}`, 'info');
  log(`   API Base: ${API_BASE}`, 'info');
  log(`   Timeout: ${TEST_CONFIG.test_timeout}ms`, 'info');
  
  try {
    // Run all tests
    await testAINotificationCreation();
    await testSmartTiming();
    await testEngagementTracking();
    await testPredictiveInsights();
    await testUserBehaviorAnalytics();
    await testEngagementAnalytics();
    await testAIPreferences();
    await testAutomatedActions();
    await testRateLimiting();
    
    // Print final results
    log('\n📊 Test Results Summary:', 'info');
    log(`✅ Passed: ${testResults.passed}`, 'success');
    log(`❌ Failed: ${testResults.failed}`, 'error');
    log(`📝 Total: ${testResults.total}`, 'info');
    log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
    
    if (testResults.failed > 0) {
      log('\n❌ Failed Tests:', 'error');
      testResults.details.forEach(detail => log(`   ${detail}`, 'error'));
    }
    
    if (testResults.passed === testResults.total) {
      log('\n🎉 All tests passed! Your AI notification system is working perfectly!', 'success');
    } else {
      log('\n⚠️ Some tests failed. Check the details above and fix the issues.', 'warning');
    }
    
  } catch (error) {
    log(`💥 Test suite failed with error: ${error.message}`, 'error');
  }
}

// Export for Node.js usage
if (typeof module !== 'undefined') {
  module.exports = {
    runAllTests,
    testAINotificationCreation,
    testSmartTiming,
    testEngagementTracking,
    testPredictiveInsights,
    testUserBehaviorAnalytics,
    testEngagementAnalytics,
    testAIPreferences,
    testAutomatedActions,
    testRateLimiting,
    TEST_CONFIG
  };
}

// Auto-run if called directly
if (typeof window === 'undefined' && require.main === module) {
  runAllTests();
} 