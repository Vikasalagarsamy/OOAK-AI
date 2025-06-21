import { pool } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { recordMessage, getBusinessInsights } from '../../../../lib/message-orchestrator'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

// In-memory cache for immediate access
let whatsappMessagesCache: any[] = []

// **FILE-BASED PERSISTENT STORAGE** (survives server restarts)
const STORAGE_DIR = path.join(process.cwd(), 'data')
const MESSAGES_FILE = path.join(STORAGE_DIR, 'whatsapp_messages.json')

// Initialize storage directory
async function initStorage() {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true })
  }
}

// **LOAD MESSAGES FROM PERSISTENT STORAGE ON STARTUP**
async function loadPersistedMessages() {
  try {
    if (existsSync(MESSAGES_FILE)) {
      const data = await readFile(MESSAGES_FILE, 'utf-8')
      const persistedMessages = JSON.parse(data)
      whatsappMessagesCache = persistedMessages
      console.log(`✅ Loaded ${persistedMessages.length} messages from persistent storage`)
    } else {
      console.log('📝 No persistent storage file found, starting fresh')
    }
  } catch (error) {
    console.error('⚠️ Error loading persisted messages:', error)
    whatsappMessagesCache = []
  }
}

// **SAVE MESSAGES TO PERSISTENT STORAGE**
async function saveMessagesToDisk() {
  try {
    await initStorage()
    await writeFile(MESSAGES_FILE, JSON.stringify(whatsappMessagesCache, null, 2))
    console.log(`💾 Saved ${whatsappMessagesCache.length} messages to persistent storage`)
  } catch (error) {
    console.error('❌ Error saving messages to disk:', error)
  }
}

// **STORE MESSAGE WITH MULTIPLE PERSISTENCE STRATEGIES - PostgreSQL Migration**
async function storeMessage(messageData: any) {
  console.log('💾 STORING MESSAGE - AI MUST KNOW EVERYTHING (PostgreSQL)')
  
  const messageRecord = {
    id: messageData.id,
    message_id: messageData.id,
    from_phone: messageData.from,
    to_phone: 'business_phone',
    content: messageData.text?.body || '',
    message_type: messageData.type || 'text',
    timestamp: new Date(parseInt(messageData.timestamp) * 1000).toISOString(),
    is_from_client: true,
    processed: false,
    raw_data: messageData,
    storage_methods: [] as string[]
  }

  // Strategy 1: Add to in-memory cache
  whatsappMessagesCache.push(messageRecord)
  messageRecord.storage_methods.push('in_memory_cache')
  
  // Keep only last 100 messages in memory
  if (whatsappMessagesCache.length > 100) {
    whatsappMessagesCache = whatsappMessagesCache.slice(-100)
  }

  // Strategy 2: Save to persistent file storage
  try {
    await saveMessagesToDisk()
    messageRecord.storage_methods.push('file_storage')
  } catch (error) {
    console.log('⚠️ File storage failed:', error)
  }

  // Strategy 3: PostgreSQL database storage
  try {
    await storeMessageInDatabase(messageData)
    messageRecord.storage_methods.push('postgresql_database')
  } catch (error) {
    console.log('⚠️ PostgreSQL storage failed:', error)
  }

  console.log(`✅ Message stored using: ${messageRecord.storage_methods.join(', ')}`)
  return {
    success: true,
    storage_methods: messageRecord.storage_methods,
    total_messages: whatsappMessagesCache.length
  }
}

// Load persisted messages on startup
loadPersistedMessages()

// **AUTOMATIC RESPONSE SYSTEM**
async function sendWhatsAppResponse(toPhone: string, message: string, customerName?: string) {
  console.log(`📤 SENDING WHATSAPP RESPONSE to ${toPhone}: ${message}`)
  
  // **TRUNCATE MESSAGE TO INTERAKT LIMIT (1024 characters)**
  let truncatedMessage = message
  if (message.length > 950) { // Leave safe buffer
    truncatedMessage = message.substring(0, 900) + '...\n\nMore details available! 📞'
    console.log(`⚠️ Message truncated from ${message.length} to ${truncatedMessage.length} characters`)
  }
  
  // Check if API key is configured
  if (!process.env.INTERAKT_API_KEY) {
    console.log('⚠️ INTERAKT_API_KEY not configured - would send: ', truncatedMessage)
    return { 
      success: true, 
      result: 'Simulated response (API key needed for real sending)',
      simulated: true 
    }
  }
  
  try {
    // **INTERAKT API - Send Direct Text Message**
    const interaktResponse = await fetch('https://api.interakt.ai/v1/public/message/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${process.env.INTERAKT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: toPhone.replace('+91', '').replace('91', ''), // Remove country code
        type: "Text",
        data: {
          message: truncatedMessage
        }
      })
    })

    const result = await interaktResponse.json()
    
    if (interaktResponse.ok) {
      console.log('✅ WhatsApp response sent successfully:', result)
      return { success: true, result }
    } else {
      console.log('❌ Failed to send WhatsApp response:', result)
      return { success: false, error: result }
    }
    
  } catch (error: any) {
    console.error('❌ Error sending WhatsApp response:', error.message)
    return { success: false, error: error.message }
  }
}

// **PERSISTENT DATABASE STORAGE - AI TABLE INTEGRATION - PostgreSQL Migration**
async function storeMessageInDatabase(messageData: any, messageDirection: 'incoming' | 'outgoing' = 'incoming') {
  console.log(`💾 STORING ${messageDirection.toUpperCase()} MESSAGE IN PostgreSQL DATABASE - EVERYTHING FOR ANALYSIS`)
  
  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    // First, try to find associated quotation by phone number
    let quotationId = null
    const phoneNumber = messageDirection === 'outgoing' ? messageData.to : messageData.from
    
    // Create multiple variations for matching
    const cleanPhone = phoneNumber.replace(/^\+?91/, '').replace(/\s+/g, '') // Remove country code and spaces
    const withCountryCode = phoneNumber.startsWith('+') ? phoneNumber : `+91${cleanPhone}`
    const withCountryCodeSpace = `+91 ${cleanPhone}`
    const justDigits = cleanPhone
    
    console.log(`🔍 Searching for quotation with phone variations:`)
    console.log(`   Original: ${phoneNumber}`)
    console.log(`   Clean digits: ${cleanPhone}`)
    console.log(`   With +91: ${withCountryCode}`)
    console.log(`   With +91 space: ${withCountryCodeSpace}`)
    
    // Search across ALL phone columns with multiple phone number formats using PostgreSQL
    const quotationQuery = `
      SELECT id, mobile, whatsapp, alternate_mobile, alternate_whatsapp
      FROM quotations
      WHERE mobile ILIKE $1 OR whatsapp ILIKE $1 
         OR alternate_mobile ILIKE $1 OR alternate_whatsapp ILIKE $1
         OR mobile ILIKE $2 OR whatsapp ILIKE $2
         OR alternate_mobile ILIKE $2 OR alternate_whatsapp ILIKE $2
      LIMIT 1
    `
    
    const quotationResult = await client.query(quotationQuery, [
      `%${cleanPhone}%`,
      `%${justDigits}%`
    ])
    
    if (quotationResult.rows.length > 0) {
      const quotation = quotationResult.rows[0]
      quotationId = quotation.id
      console.log(`🎯 FOUND QUOTATION MATCH! ID: ${quotationId} for phone: ${phoneNumber}`)
      console.log(`📊 Matched against:`)
      console.log(`   mobile: ${quotation.mobile}`)
      console.log(`   whatsapp: ${quotation.whatsapp}`)
      console.log(`   alternate_mobile: ${quotation.alternate_mobile}`)
      console.log(`   alternate_whatsapp: ${quotation.alternate_whatsapp}`)
    } else {
      console.log(`📭 No quotation found for phone: ${phoneNumber}`)
      console.log(`   Searched mobile, whatsapp, alternate_mobile, alternate_whatsapp columns`)
    }

    // Create record for whatsapp_messages table using existing business schema
    const messageInsertQuery = `
      INSERT INTO whatsapp_messages (
        quotation_id, client_phone, message_text, message_type, timestamp, 
        interakt_message_id, media_url, media_type, ai_analyzed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `
    
    const messageResult = await client.query(messageInsertQuery, [
      quotationId,
      phoneNumber,
      messageDirection === 'outgoing' ? messageData.message : (messageData.text?.body || messageData.content || ''),
      messageDirection,
      messageDirection === 'outgoing' ? new Date().toISOString() : new Date(parseInt(messageData.timestamp) * 1000).toISOString(),
      messageData.id || `${messageDirection}_${Date.now()}`,
      messageData.media_url || null,
      messageData.type === 'text' ? null : messageData.type,
      false
    ])

    const messageId = messageResult.rows[0].id

    // Store in communications table for enhanced analytics
    const communicationQuery = `
      INSERT INTO communications (
        channel_type, message_id, sender_type, sender_id, sender_name,
        recipient_type, recipient_id, recipient_name, content_type, content_text,
        content_metadata, business_context, ai_processed, ai_priority_score,
        sent_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING id
    `
    
    const commResult = await client.query(communicationQuery, [
      'whatsapp',
      messageData.id || `whatsapp_${Date.now()}`,
      messageDirection === 'incoming' ? 'client' : 'employee',
      phoneNumber,
      messageDirection === 'incoming' ? 'WhatsApp Client' : 'Business',
      messageDirection === 'incoming' ? 'employee' : 'client',
      messageDirection === 'incoming' ? 'business' : phoneNumber,
      messageDirection === 'incoming' ? 'Business' : 'WhatsApp Client',
      'text',
      messageDirection === 'outgoing' ? messageData.message : (messageData.text?.body || ''),
      JSON.stringify({
        quotation_id: quotationId,
        message_direction: messageDirection,
        interakt_message_id: messageData.id,
        media_type: messageData.type
      }),
      'whatsapp_message',
      false,
      quotationId ? 0.8 : 0.5,
      messageDirection === 'outgoing' ? new Date().toISOString() : new Date(parseInt(messageData.timestamp) * 1000).toISOString()
    ])

    await client.query('COMMIT')

    console.log(`✅ STORED ${messageDirection.toUpperCase()} MESSAGE IN PostgreSQL DATABASE: whatsapp_messages ID: ${messageId}, communications ID: ${commResult.rows[0].id}`)
    
    // If we have a quotation, trigger AI analysis
    if (quotationId) {
      console.log(`🧠 Message linked to quotation ${quotationId} - AI analysis will be triggered`)
      
      // Import and call AI analysis
      try {
        const { analyzeClientCommunication } = await import('../../../../actions/ai-communication-analysis')
        
        // Trigger AI analysis in background (don't wait for completion)
        analyzeClientCommunication(quotationId).then(result => {
          if (result.success) {
            console.log(`✅ AI analysis completed for quotation ${quotationId}`)
          } else {
            console.log(`⚠️ AI analysis failed: ${result.error}`)
          }
        }).catch(error => {
          console.log(`❌ AI analysis error: ${error.message}`)
        })
        
      } catch (importError) {
        console.log(`⚠️ AI analysis import failed: ${importError}`)
      }
    }
    
    return { 
      success: true, 
      table: 'whatsapp_messages', 
      message_id: messageId,
      communication_id: commResult.rows[0].id,
      quotation_linked: !!quotationId
    }

  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK')
    }
    console.log(`❌ PostgreSQL database storage error:`, error.message)
    return { success: false, error: error.message }
  } finally {
    if (client) {
      client.release()
    }
  }
}

// **GET WEBHOOK INFORMATION - PostgreSQL Migration**
export async function GET(request: NextRequest) {
  let client
  try {
    client = await pool.connect()
    
    // Get PostgreSQL statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN message_type = 'incoming' THEN 1 END) as incoming_messages,
        COUNT(CASE WHEN message_type = 'outgoing' THEN 1 END) as outgoing_messages,
        COUNT(CASE WHEN ai_analyzed = true THEN 1 END) as ai_analyzed,
        COUNT(CASE WHEN quotation_id IS NOT NULL THEN 1 END) as linked_to_quotations
      FROM whatsapp_messages
    `
    
    const statsResult = await client.query(statsQuery)
    const stats = statsResult.rows[0]

    return NextResponse.json({
      message: 'WhatsApp Webhook Endpoint (PostgreSQL)',
      description: 'Processes incoming WhatsApp messages with PostgreSQL backend',
      
      permanent_url: 'https://api.ooak.photography',
      cache_status: {
        in_memory_messages: whatsappMessagesCache.length,
        file_storage_active: existsSync(MESSAGES_FILE)
      },
      database_statistics: {
        total_messages: parseInt(stats.total_messages) || 0,
        incoming_messages: parseInt(stats.incoming_messages) || 0,
        outgoing_messages: parseInt(stats.outgoing_messages) || 0,
        ai_analyzed: parseInt(stats.ai_analyzed) || 0,
        linked_to_quotations: parseInt(stats.linked_to_quotations) || 0
      },
      storage_methods: [
        'in_memory_cache',
        'file_storage', 
        'postgresql_database'
      ],
      ai_features: [
        'Automatic quotation matching',
        'AI communication analysis',
        'Business context awareness',
        'Response automation',
        'Multi-storage persistence'
      ]
    })

  } catch (error) {
    console.error('❌ Error getting webhook status:', error)
    return NextResponse.json({
      message: 'WhatsApp Webhook Endpoint (PostgreSQL)',
      
      error: error instanceof Error ? error.message : 'Unknown error',
      cache_status: {
        in_memory_messages: whatsappMessagesCache.length,
        file_storage_active: existsSync(MESSAGES_FILE)
      }
    })
  } finally {
    if (client) {
      client.release()
    }
  }
}

// WhatsApp message processing - PostgreSQL Migration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📱 WhatsApp Webhook received (PostgreSQL PERMANENT URL):', JSON.stringify(body, null, 2))
    console.log('📥 WhatsApp webhook data:', JSON.stringify(body, null, 2))

    // Extract messages from webhook (support both Meta and Interakt formats)
    let messages: any[] = []
    
    // **INTERAKT FORMAT** (what you're using)
    if (body?.data?.message?.message && body?.data?.customer) {
      console.log('📱 INTERAKT format detected')
      const interaktMessage = {
        id: body.data.message.id || `interakt_${Date.now()}`,
        from: body.data.customer.channel_phone_number || body.data.customer.phone_number,
        timestamp: new Date(body.data.message.received_at_utc || new Date()).getTime() / 1000,
        type: 'text',
        text: { body: body.data.message.message },
        customer_name: body.data.customer.traits?.name || body.data.customer.traits?.User,
        customer_email: body.data.customer.traits?.email || body.data.customer.traits?.['Email Id'],
        interakt_data: body.data
      }
      messages = [interaktMessage]
    }
    // **META FORMAT** (standard WhatsApp Business API)
    else if (body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      console.log('📱 META format detected')
      messages = body.entry[0].changes[0].value.messages
    }
    
    if (messages.length === 0) {
      console.log('ℹ️ No messages in webhook')
      return NextResponse.json({ status: 'no_messages',  })
    }

    let storedCount = 0
    let latestMessage = ''
    const storageResults = []

    for (const message of messages) {
      console.log(`\n🔄 Processing message: ${message.id}`)
      console.log(`📞 From: ${message.from}`)
      console.log(`💬 Content: ${message.text?.body}`)

      // **CRITICAL: STORE MESSAGE WITH PERSISTENCE**
      const storeResult = await storeMessage(message)
      storageResults.push(storeResult)

      storedCount++
      latestMessage = message.text?.body || ''
      
      console.log(`✅ Message processed: ${storeResult.storage_methods.join(', ')}`)

      // **🎯 AI ORCHESTRATION SYSTEM - RECORD ALL MESSAGES**
      await recordMessage(
        'incoming', 
        'whatsapp', 
        message.from, 
        message.text?.body || '', 
        {
          client_name: message.customer_name,
          client_email: message.customer_email,
          message_type: message.type || 'text',
          raw_data: message
        }
      )

      // **🚨 CRITICAL: ONLY RESPOND TO TEST NUMBER - PROTECT LIVE BUSINESS**
      const customerName = message.customer_name || 'Customer'
      const ALLOWED_TEST_NUMBERS = [
        '919677362524',    // Vikas test number
        '+919677362524'    // With country code
      ]
      const isTestingNumber = ALLOWED_TEST_NUMBERS.includes(message.from)
      
      console.log(`🔍 Message from: ${message.from} | Test number: ${isTestingNumber ? 'YES - WILL RESPOND' : 'NO - SILENT MODE'}`)
      
      if (isTestingNumber) {
        // **ENHANCED AI BUSINESS INTELLIGENCE RESPONSE**
        console.log(`🤖 Generating AI response for test number: ${message.from}`)
        
        try {
          const businessInsights = await getBusinessInsights()
          const responseMessage = `✅ AI System Ready (PostgreSQL)\n\nMessage received: "${message.text?.body}"\n\n🚀 Business Status:\n${businessInsights}\n\nPowered by PostgreSQL Database 💪`
          
          const responseResult = await sendWhatsAppResponse(message.from, responseMessage, customerName)
          
          // **🎯 RECORD OUTGOING RESPONSE IN ORCHESTRATOR AND DATABASE**
          if (responseResult.success) {
            await recordMessage(
              'outgoing', 
              'whatsapp', 
              message.from, 
              responseMessage, 
              {
                client_name: customerName,
                message_type: 'text',
                auto_generated: true
              }
            )
            
            // **💾 CRITICAL: STORE OUTGOING MESSAGE IN DATABASE TOO**
            try {
              await storeMessageInDatabase({
                to: message.from,
                message: responseMessage,
                id: `outgoing_${Date.now()}`,
                type: 'text'
              }, 'outgoing')
              console.log(`✅ Outgoing message also stored in PostgreSQL database`)
            } catch (dbError: any) {
              console.log(`⚠️ Outgoing message database storage failed: ${dbError.message}`)
            }
            
            console.log(`✅ Automatic response sent to ${message.from}`)
          } else {
            console.log(`❌ Failed to send response to ${message.from}:`, responseResult.error)
          }
        } catch (aiError: any) {
          console.log(`⚠️ AI response generation failed: ${aiError.message}`)
        }
      } else {
        console.log(`🔇 LIVE BUSINESS NUMBER - NO AI RESPONSE | From: ${message.from}`)
        console.log(`📝 Message stored for analysis but NO automatic response sent`)
        console.log(`🚨 PROTECTION: Preventing AI from responding to live business clients`)
      }
    }

    const response = {
      status: 'success',
      
      permanent_url: 'https://api.ooak.photography',
      messages_processed: storedCount,
      messages_in_cache: whatsappMessagesCache.length,
      latest_message: latestMessage,
      storage_methods: [...new Set(storageResults.flatMap(r => r.storage_methods))],
      persistent_storage: 'active'
    }

    console.log('\n🎯 WEBHOOK RESPONSE:', response)
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ WhatsApp webhook error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      
      message: error.message 
    }, { status: 500 })
  }
}

// **UTILITY FUNCTIONS FOR TESTING**

