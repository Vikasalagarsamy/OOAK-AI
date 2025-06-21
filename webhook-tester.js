// Universal AI System - Webhook Integration Tester
// Comprehensive testing utility for real platform integrations

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class WebhookTester {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.testResults = [];
    this.platforms = ['whatsapp', 'instagram', 'email', 'calls'];
    this.startTime = new Date();
  }

  // Test all webhook endpoints
  async runFullIntegrationTest() {
    console.log('🚀 Starting Universal AI Integration Testing...\n');
    
    await this.testEnvironmentSetup();
    await this.testWhatsAppIntegration();
    await this.testInstagramIntegration();
    await this.testEmailIntegration();
    await this.testCallsIntegration();
    await this.testUniversalAI();
    await this.generateTestReport();
    
    console.log('\n✅ Integration testing completed!');
  }

  // Environment and connectivity tests
  async testEnvironmentSetup() {
    console.log('📋 Phase 1: Environment Setup Testing');
    
    // Test database connectivity
    await this.testEndpoint('/api/setup-universal-bi-tables', 'GET', null, 'Database Setup');
    
    // Test Universal AI service
    await this.testEndpoint('/api/ai-universal-chat', 'POST', {
      message: "System health check"
    }, 'Universal AI Health');
    
    console.log('✅ Environment setup tests completed\n');
  }

  // WhatsApp Business API Integration Tests
  async testWhatsAppIntegration() {
    console.log('📱 Phase 2: WhatsApp Integration Testing');
    
    // Webhook verification test
    await this.testEndpoint('/api/webhooks/whatsapp', 'GET', null, 'WhatsApp Verification', {
      'hub.mode': 'subscribe',
      'hub.challenge': 'test_challenge_123',
      'hub.verify_token': process.env.WHATSAPP_VERIFY_TOKEN || 'test_token'
    });

    // Text message processing
    const textMessage = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test_business_id',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: { phone_number_id: 'test_phone_id' },
            messages: [{
              id: 'test_msg_' + Date.now(),
              from: '1234567890',
              timestamp: Math.floor(Date.now() / 1000),
              type: 'text',
              text: { body: 'Hello! I need information about your services.' }
            }]
          },
          field: 'messages'
        }]
      }]
    };
    
    await this.testEndpoint('/api/webhooks/whatsapp', 'POST', textMessage, 'WhatsApp Text Message');

    // Media message test
    const mediaMessage = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test_business_id',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: { phone_number_id: 'test_phone_id' },
            messages: [{
              id: 'test_media_' + Date.now(),
              from: '1234567890',
              timestamp: Math.floor(Date.now() / 1000),
              type: 'image',
              image: {
                id: 'test_image_id',
                mime_type: 'image/jpeg',
                caption: 'Product inquiry image'
              }
            }]
          },
          field: 'messages'
        }]
      }]
    };
    
    await this.testEndpoint('/api/webhooks/whatsapp', 'POST', mediaMessage, 'WhatsApp Media Message');
    
    console.log('✅ WhatsApp integration tests completed\n');
  }

  // Instagram Business Integration Tests
  async testInstagramIntegration() {
    console.log('📸 Phase 3: Instagram Integration Testing');
    
    // Instagram DM test
    const instagramDM = {
      object: 'instagram',
      entry: [{
        id: 'test_ig_account',
        time: Math.floor(Date.now() / 1000),
        messaging: [{
          sender: { id: 'test_user_123' },
          recipient: { id: 'test_business_account' },
          timestamp: Date.now(),
          message: {
            mid: 'test_dm_' + Date.now(),
            text: 'Hi! I saw your post about new products. Can you tell me more?'
          }
        }]
      }]
    };
    
    await this.testEndpoint('/api/webhooks/instagram', 'POST', instagramDM, 'Instagram DM');

    // Story mention test
    const storyMention = {
      object: 'instagram',
      entry: [{
        id: 'test_ig_account',
        time: Math.floor(Date.now() / 1000),
        messaging: [{
          sender: { id: 'test_user_456' },
          recipient: { id: 'test_business_account' },
          timestamp: Date.now(),
          message: {
            mid: 'test_story_' + Date.now(),
            story_mention: {
              link: 'https://instagram.com/stories/test_user/123456789',
              id: 'story_mention_id'
            }
          }
        }]
      }]
    };
    
    await this.testEndpoint('/api/webhooks/instagram', 'POST', storyMention, 'Instagram Story Mention');
    
    console.log('✅ Instagram integration tests completed\n');
  }

  // Email Integration Tests
  async testEmailIntegration() {
    console.log('📧 Phase 4: Email Integration Testing');
    
    // Gmail webhook test
    const gmailNotification = {
      message: {
        data: Buffer.from(JSON.stringify({
          emailAddress: 'business@example.com',
          historyId: '12345'
        })).toString('base64'),
        messageId: 'test_gmail_' + Date.now(),
        publishTime: new Date().toISOString()
      }
    };
    
    await this.testEndpoint('/api/webhooks/email', 'POST', gmailNotification, 'Gmail Webhook');

    // Direct email processing test
    const emailData = {
      from: 'customer@example.com',
      to: 'business@example.com',
      subject: 'Service Inquiry - Website Development',
      body: 'Hello, I am interested in your web development services. Could you provide more information about pricing and timelines?',
      timestamp: new Date().toISOString(),
      messageId: 'test_email_' + Date.now()
    };
    
    await this.testEndpoint('/api/webhooks/email', 'POST', { email: emailData }, 'Direct Email Processing');
    
    console.log('✅ Email integration tests completed\n');
  }

  // Call Integration Tests
  async testCallsIntegration() {
    console.log('📞 Phase 5: Call Integration Testing');
    
    // Call recording webhook test
    const callData = {
      callId: 'test_call_' + Date.now(),
      from: '+1234567890',
      to: '+1987654321',
      duration: 300,
      recordingUrl: 'https://example.com/recordings/test_call.mp3',
      status: 'completed',
      timestamp: new Date().toISOString(),
      direction: 'inbound'
    };
    
    await this.testEndpoint('/api/webhooks/calls', 'POST', callData, 'Call Recording Webhook');

    // Call with transcript test
    const callWithTranscript = {
      callId: 'test_call_transcript_' + Date.now(),
      from: '+1234567890',
      to: '+1987654321',
      duration: 180,
      transcript: 'Customer: Hi, I need help with my recent order. Agent: I can help you with that. What is your order number?',
      sentiment: 'neutral',
      keyPhrases: ['order help', 'order number'],
      timestamp: new Date().toISOString()
    };
    
    await this.testEndpoint('/api/webhooks/calls', 'POST', callWithTranscript, 'Call with Transcript');
    
    console.log('✅ Call integration tests completed\n');
  }

  // Universal AI System Tests
  async testUniversalAI() {
    console.log('🤖 Phase 6: Universal AI System Testing');
    
    const testQueries = [
      'Show me all recent customer communications',
      'What are our top leads this month?',
      'How many WhatsApp messages did we receive today?',
      'Who are our most active customers across all channels?',
      'Generate a summary of today\'s business activities',
      'What follow-ups are needed for pending quotations?'
    ];

    for (const query of testQueries) {
      await this.testEndpoint('/api/ai-universal-chat', 'POST', {
        message: query
      }, `Universal AI: "${query.substring(0, 30)}..."`);
      
      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Universal AI system tests completed\n');
  }

  // Generic endpoint testing method
  async testEndpoint(endpoint, method, data = null, testName, queryParams = {}) {
    const startTime = Date.now();
    
    try {
      let url = `${this.baseUrl}${endpoint}`;
      
      // Add query parameters if provided
      if (Object.keys(queryParams).length > 0) {
        const params = new URLSearchParams(queryParams);
        url += `?${params.toString()}`;
      }

      const config = {
        method,
        url,
        timeout: 10000
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      const duration = Date.now() - startTime;
      
      const result = {
        test: testName,
        endpoint,
        method,
        status: 'PASS',
        statusCode: response.status,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      };
      
      this.testResults.push(result);
      console.log(`✅ ${testName}: ${response.status} (${duration}ms)`);
      
      return response.data;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const result = {
        test: testName,
        endpoint,
        method,
        status: 'FAIL',
        error: error.message,
        statusCode: error.response?.status || 'N/A',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      };
      
      this.testResults.push(result);
      console.log(`❌ ${testName}: ${error.message} (${duration}ms)`);
      
      return null;
    }
  }

  // Generate comprehensive test report
  async generateTestReport() {
    const endTime = new Date();
    const totalDuration = endTime - this.startTime;
    
    const report = {
      testSuite: 'Universal AI System Integration Testing',
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDuration: `${Math.round(totalDuration / 1000)}s`,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASS').length,
        failed: this.testResults.filter(r => r.status === 'FAIL').length,
        successRate: `${Math.round((this.testResults.filter(r => r.status === 'PASS').length / this.testResults.length) * 100)}%`
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = path.join(__dirname, 'integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display summary
    console.log('\n📊 Integration Test Report Summary:');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Success Rate: ${report.summary.successRate}`);
    console.log(`Total Duration: ${report.totalDuration}`);
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    
    return report;
  }

  generateRecommendations() {
    const failed = this.testResults.filter(r => r.status === 'FAIL');
    const recommendations = [];
    
    if (failed.length === 0) {
      recommendations.push('🎉 All tests passed! System ready for production deployment.');
      recommendations.push('📊 Consider setting up continuous monitoring for production.');
      recommendations.push('🔄 Schedule regular integration testing to maintain reliability.');
    } else {
      recommendations.push(`🔧 Fix ${failed.length} failed test(s) before production deployment.`);
      
      failed.forEach(test => {
        recommendations.push(`❌ ${test.test}: ${test.error}`);
      });
      
      recommendations.push('🔍 Review error logs and fix underlying issues.');
      recommendations.push('🧪 Re-run tests after fixes are implemented.');
    }
    
    return recommendations;
  }

  // Load testing for high volume scenarios
  async runLoadTest(concurrentRequests = 10, duration = 60) {
    console.log(`\n🚀 Running Load Test: ${concurrentRequests} concurrent requests for ${duration}s`);
    
    const testMessage = {
      message: "Load test query - Show me current business status"
    };
    
    const startTime = Date.now();
    const results = [];
    let requestCount = 0;
    
    const makeRequest = async () => {
      const reqStart = Date.now();
      try {
        await axios.post(`${this.baseUrl}/api/ai-universal-chat`, testMessage);
        const duration = Date.now() - reqStart;
        results.push({ status: 'success', duration });
      } catch (error) {
        const duration = Date.now() - reqStart;
        results.push({ status: 'error', duration, error: error.message });
      }
      requestCount++;
    };
    
    // Run concurrent requests for specified duration
    const interval = setInterval(() => {
      for (let i = 0; i < concurrentRequests; i++) {
        makeRequest();
      }
    }, 1000);
    
    setTimeout(() => {
      clearInterval(interval);
      
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'error').length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      console.log('\n📊 Load Test Results:');
      console.log(`Total Requests: ${requestCount}`);
      console.log(`Successful: ${successful}`);
      console.log(`Failed: ${failed}`);
      console.log(`Success Rate: ${Math.round((successful / requestCount) * 100)}%`);
      console.log(`Average Response Time: ${Math.round(avgDuration)}ms`);
      console.log(`Requests per Second: ${Math.round(requestCount / (duration))}`);
      
    }, duration * 1000);
  }
}

// CLI Interface
if (require.main === module) {
  const tester = new WebhookTester();
  const command = process.argv[2];
  
  switch (command) {
    case 'full':
      tester.runFullIntegrationTest();
      break;
    case 'load':
      const concurrent = parseInt(process.argv[3]) || 10;
      const duration = parseInt(process.argv[4]) || 60;
      tester.runLoadTest(concurrent, duration);
      break;
    case 'whatsapp':
      tester.testWhatsAppIntegration();
      break;
    case 'instagram':
      tester.testInstagramIntegration();
      break;
    case 'email':
      tester.testEmailIntegration();
      break;
    case 'calls':
      tester.testCallsIntegration();
      break;
    case 'ai':
      tester.testUniversalAI();
      break;
    default:
      console.log(`
🧪 Universal AI System - Integration Tester

Usage:
  node webhook-tester.js full                    # Run all integration tests
  node webhook-tester.js load [concurrent] [duration] # Load testing (default: 10 req/s for 60s)
  node webhook-tester.js whatsapp               # Test WhatsApp integration only
  node webhook-tester.js instagram              # Test Instagram integration only
  node webhook-tester.js email                 # Test Email integration only
  node webhook-tester.js calls                 # Test Calls integration only  
  node webhook-tester.js ai                    # Test Universal AI only

Examples:
  node webhook-tester.js full                   # Complete integration test
  node webhook-tester.js load 20 120           # 20 concurrent requests for 2 minutes
      `);
  }
}

module.exports = WebhookTester; 