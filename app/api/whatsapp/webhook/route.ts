import { NextRequest, NextResponse } from 'next/server'
import { processIncomingWhatsAppMessage } from '@/actions/ai-communication-analysis'

export async function POST(request: NextRequest) {
  try {
    console.log('📨 WhatsApp webhook received')
    
    const body = await request.json()
    console.log('📥 Webhook payload:', JSON.stringify(body, null, 2))
    
    // Interakt webhook structure - adjust based on your provider
    if (body.type === 'message' && body.direction === 'inbound') {
      const messageData = {
        phone: body.from,
        message: body.text || body.content,
        timestamp: body.timestamp || new Date().toISOString(),
        messageId: body.id || `msg_${Date.now()}`
      }
      
      console.log('📱 Processing incoming WhatsApp message:', messageData)
      
      // Process the message and trigger AI analysis
      const result = await processIncomingWhatsAppMessage(messageData)
      
      if (result.success) {
        console.log('✅ WhatsApp message processed successfully')
        return NextResponse.json({ 
          success: true, 
          message: 'Message processed and AI analysis triggered' 
        })
      } else {
        console.log('⚠️ Message processing failed:', result.error)
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 400 })
      }
    }
    
    // For other webhook types (delivery status, etc.), just acknowledge
    console.log('📋 Webhook acknowledged (non-message type)')
    return NextResponse.json({ success: true, message: 'Webhook received' })
    
  } catch (error: any) {
    console.error('❌ WhatsApp webhook error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Webhook processing failed' 
    }, { status: 500 })
  }
}

// Handle GET requests for webhook verification (some providers require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('hub.challenge')
  const verifyToken = searchParams.get('hub.verify_token')
  
  // Verify webhook setup (adjust token as needed)
  if (verifyToken === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge)
  }
  
  return new Response('Forbidden', { status: 403 })
} 