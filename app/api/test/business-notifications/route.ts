import { NextRequest, NextResponse } from 'next/server'
import { BusinessNotificationService } from '@/lib/business-notification-service'
import { createClient } from '@/lib/supabase/server'

// 🧪 Business Notification Testing Suite
export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json()
    
    console.log(`🧪 Testing business notifications: ${testType || 'all'}`)
    
    const results: any[] = []
    
    if (!testType || testType === 'quotation_created') {
      results.push(await testQuotationCreated())
    }
    
    if (!testType || testType === 'quotation_approved') {
      results.push(await testQuotationApproved())
    }
    
    if (!testType || testType === 'payment_received') {
      results.push(await testPaymentReceived())
    }
    
    if (!testType || testType === 'ai_alert') {
      results.push(await testAIAlert())
    }
    
    if (!testType || testType === 'performance_anomaly') {
      results.push(await testPerformanceAnomaly())
    }
    
    if (!testType || testType === 'event_deadline') {
      results.push(await testEventDeadline())
    }
    
    return NextResponse.json({
      success: true,
      message: 'Business notification tests completed',
      results,
      total_notifications: results.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Business notification test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 🧪 Test quotation created notification
async function testQuotationCreated() {
  const mockQuotation = {
    id: 9999,
    quotation_number: 'TEST-QUOT-001',
    client_name: 'Test Wedding Client',
    bride_name: 'Test Bride',
    groom_name: 'Test Groom',
    total_amount: 350000,
    created_by: '1',
    status: 'draft'
  }
  
  await BusinessNotificationService.notifyQuotationCreated(mockQuotation, '1')
  
  return {
    test: 'quotation_created',
    status: 'completed',
    description: '📝 New quotation creation notification sent to management and creator'
  }
}

// 🧪 Test quotation approved notification
async function testQuotationApproved() {
  const mockQuotation = {
    id: 9999,
    quotation_number: 'TEST-QUOT-002',
    client_name: 'Approved Wedding Client',
    bride_name: 'Happy Bride',
    groom_name: 'Happy Groom',
    total_amount: 500000,
    created_by: 1,
    status: 'approved'
  }
  
  await BusinessNotificationService.notifyQuotationApproved(mockQuotation, 'Sales Manager')
  
  return {
    test: 'quotation_approved',
    status: 'completed',
    description: '🎉 Quotation approval notification sent to creator and management'
  }
}

// 🧪 Test payment received notification
async function testPaymentReceived() {
  const mockQuotation = {
    id: 9999,
    quotation_number: 'TEST-QUOT-003',
    client_name: 'Payment Client',
    total_amount: 750000,
    created_by: 1
  }
  
  await BusinessNotificationService.notifyPaymentReceived(mockQuotation, 375000, 'Finance Team')
  
  return {
    test: 'payment_received',
    status: 'completed',
    description: '💰 Payment received notification sent to sales team and accounts'
  }
}

// 🧪 Test AI alert notification
async function testAIAlert() {
  const mockQuotation = {
    id: 9999,
    quotation_number: 'TEST-QUOT-004',
    client_name: 'Low Probability Client',
    created_by: 1,
    status: 'sent'
  }
  
  await BusinessNotificationService.notifyLowSuccessProbability(mockQuotation, 25)
  
  return {
    test: 'ai_alert',
    status: 'completed',
    description: '⚠️ AI low success probability alert sent to salesperson'
  }
}

// 🧪 Test performance anomaly notification
async function testPerformanceAnomaly() {
  const mockEmployee = {
    employee_id: 'EMP001',
    full_name: 'Test Sales Rep',
    email: 'test@company.com',
    role: 'Sales Representative'
  }
  
  const mockMetrics = {
    conversion_rate: 12,
    threshold: 15,
    activity_score: 45,
    decrease: 30
  }
  
  await BusinessNotificationService.notifyTeamPerformanceAnomaly(
    mockEmployee,
    'conversion_rate_drop',
    mockMetrics
  )
  
  return {
    test: 'performance_anomaly',
    status: 'completed',
    description: '👤 Performance anomaly alert sent to management'
  }
}

// 🧪 Test event deadline notification
async function testEventDeadline() {
  const mockQuotation = {
    id: 9999,
    quotation_number: 'TEST-QUOT-005',
    client_name: 'Upcoming Event Client',
    created_by: 1
  }
  
  const mockEvent = {
    id: 9999,
    event_name: 'Test Wedding Ceremony',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  }
  
  await BusinessNotificationService.notifyEventDeadlineApproaching(mockQuotation, mockEvent, 7)
  
  return {
    test: 'event_deadline',
    status: 'completed',
    description: '⏰ Event deadline approaching notification sent to salesperson and operations'
  }
}

// 🧪 GET endpoint for easy testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const testType = searchParams.get('type')
  
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ testType }),
    headers: { 'Content-Type': 'application/json' }
  }))
} 