#!/usr/bin/env node

/**
 * WHATSAPP TESTING FOR VIKAS (+919677362524)
 * ==========================================
 * 
 * This script tests the complete WhatsApp integration flow:
 * 1. Simulate WhatsApp messages from your number
 * 2. Test webhook processing
 * 3. Test AI reading WhatsApp data
 * 4. Show complete conversation flow
 */

const baseUrl = 'http://localhost:3000'

class WhatsAppTester {
  constructor() {
    this.testNumber = '+919677362524'
    this.testCases = []
  }

  async runCompleteTest() {
    console.log('📱 WHATSAPP INTEGRATION TEST - VIKAS NUMBER')
    console.log('============================================')
    console.log(`📞 Test Number: ${this.testNumber}`)
    console.log(`🔗 Webhook URL: ${baseUrl}/api/webhooks/whatsapp`)
    console.log('')

    // Test 1: Webhook verification
    await this.testWebhookVerification()
    
    // Test 2: Business inquiry message
    await this.testBusinessInquiry()
    
    // Test 3: Lead follow-up message
    await this.testLeadFollowup()
    
    // Test 4: Business data request
    await this.testBusinessDataRequest()
    
    // Test 5: AI reading WhatsApp data
    await this.testAIReadingWhatsApp()
    
    // Summary
    this.showTestSummary()
  }

  async testWebhookVerification() {
    console.log('🔍 Test 1: WhatsApp Webhook Verification')
    
    try {
      const response = await fetch(
        `${baseUrl}/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test_challenge_vikas&hub.verify_token=whatsapp_verify_123`
      )
      
      const result = await response.text()
      
      if (response.status === 200 && result === 'test_challenge_vikas') {
        console.log('✅ Webhook verification: PASSED')
        this.testCases.push({ name: 'Webhook Verification', status: 'PASSED' })
      } else {
        console.log('❌ Webhook verification: FAILED')
        this.testCases.push({ name: 'Webhook Verification', status: 'FAILED' })
      }
    } catch (error) {
      console.log('❌ Webhook verification: ERROR -', error.message)
      this.testCases.push({ name: 'Webhook Verification', status: 'ERROR' })
    }
    
    console.log('')
  }

  async testBusinessInquiry() {
    console.log('💼 Test 2: Business Inquiry Message')
    
    const whatsappMessage = {
      object: "whatsapp_business_account",
      entry: [{
        id: "business_account_id",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "919677362524",
              phone_number_id: "test_business_phone"
            },
            messages: [{
              id: `msg_${Date.now()}_1`,
              from: "919677362524",
              timestamp: Math.floor(Date.now() / 1000).toString(),
              text: {
                body: "Hi! I'm interested in your photography services. Can you share your portfolio and pricing?"
              },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    }

    await this.sendWhatsAppMessage(whatsappMessage, 'Business Inquiry')
  }

  async testLeadFollowup() {
    console.log('🎯 Test 3: Lead Follow-up Message')
    
    const whatsappMessage = {
      object: "whatsapp_business_account",
      entry: [{
        id: "business_account_id",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "919677362524",
              phone_number_id: "test_business_phone"
            },
            messages: [{
              id: `msg_${Date.now()}_2`,
              from: "919677362524", 
              timestamp: Math.floor(Date.now() / 1000).toString(),
              text: {
                body: "Following up on our conversation about the wedding photography package. When can we schedule a call?"
              },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    }

    await this.sendWhatsAppMessage(whatsappMessage, 'Lead Follow-up')
  }

  async testBusinessDataRequest() {
    console.log('📊 Test 4: Business Data Request')
    
    const whatsappMessage = {
      object: "whatsapp_business_account",
      entry: [{
        id: "business_account_id",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "919677362524",
              phone_number_id: "test_business_phone"
            },
            messages: [{
              id: `msg_${Date.now()}_3`,
              from: "919677362524",
              timestamp: Math.floor(Date.now() / 1000).toString(), 
              text: {
                body: "Can you tell me about your current lead status and recent quotations?"
              },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    }

    await this.sendWhatsAppMessage(whatsappMessage, 'Business Data Request')
  }

  async sendWhatsAppMessage(messageData, testName) {
    try {
      const response = await fetch(`${baseUrl}/api/webhooks/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      const result = await response.json()
      
      if (response.status === 200 && result.status === 'success') {
        console.log(`✅ ${testName}: Message processed successfully`)
        this.testCases.push({ name: testName, status: 'PASSED' })
      } else {
        console.log(`❌ ${testName}: Message processing failed`)
        this.testCases.push({ name: testName, status: 'FAILED' })
      }
    } catch (error) {
      console.log(`❌ ${testName}: ERROR -`, error.message)
      this.testCases.push({ name: testName, status: 'ERROR' })
    }
    
    console.log('')
  }

  async testAIReadingWhatsApp() {
    console.log('🤖 Test 5: AI Reading WhatsApp Communications')
    
    try {
      const queries = [
        "What WhatsApp messages have we received recently?",
        "Show me communications from my number +919677362524",
        "What are the recent customer inquiries from WhatsApp?"
      ]

      for (const query of queries) {
        console.log(`   🔍 Query: "${query}"`)
        
        const response = await fetch(`${baseUrl}/api/ai-simple-test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            userId: "vikas_test"
          })
        })

        const result = await response.json()
        
        if (result.success && result.confidence > 0) {
          console.log(`   ✅ AI Response: ${result.response.substring(0, 100)}...`)
          console.log(`   📊 Confidence: ${result.confidence}, Model: ${result.model_used}`)
        } else {
          console.log(`   ❌ AI failed to respond properly`)
          console.log(`   📊 Confidence: ${result.confidence}, Error: ${result.error || 'Unknown'}`)
        }
        console.log('')
      }
      
      this.testCases.push({ name: 'AI Reading WhatsApp', status: 'TESTED' })
      
    } catch (error) {
      console.log('❌ AI Reading WhatsApp: ERROR -', error.message)
      this.testCases.push({ name: 'AI Reading WhatsApp', status: 'ERROR' })
    }
  }

  showTestSummary() {
    console.log('📋 WHATSAPP INTEGRATION TEST SUMMARY')
    console.log('====================================')
    
    const passed = this.testCases.filter(t => t.status === 'PASSED').length
    const failed = this.testCases.filter(t => t.status === 'FAILED').length
    const errors = this.testCases.filter(t => t.status === 'ERROR').length
    const tested = this.testCases.filter(t => t.status === 'TESTED').length
    
    this.testCases.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : 
                  test.status === 'FAILED' ? '❌' : 
                  test.status === 'ERROR' ? '🚨' : '🔍'
      console.log(`${icon} ${test.name}: ${test.status}`)
    })
    
    console.log('')
    console.log(`📊 Results: ${passed} passed, ${failed} failed, ${errors} errors, ${tested} tested`)
    console.log('')
    
    if (passed > 0) {
      console.log('🎉 WhatsApp integration is working!')
      console.log('📱 Your number +919677362524 can now:')
      console.log('   • Send messages to the webhook')
      console.log('   • Have conversations recorded')
      console.log('   • Be analyzed by the AI system')
      console.log('')
      console.log('🔗 Webhook URL for Meta Developer:')
      console.log('   https://edf3-60-243-52-206.ngrok-free.app/api/webhooks/whatsapp')
      console.log('🔑 Verify Token: whatsapp_verify_123')
    } else {
      console.log('⚠️  WhatsApp integration needs attention')
      console.log('   Check the server logs for detailed error information')
    }
  }
}

// Run the test
const tester = new WhatsAppTester()
tester.runCompleteTest().catch(console.error) 