import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'

// **READ ALL WHATSAPP MESSAGES FROM DATABASE - AI MUST KNOW EVERYTHING**
async function getAllWhatsAppMessages() {
  console.log('🔍 [AI SIMPLE TEST] AI READING ALL WHATSAPP DATA FROM PostgreSQL...')
  
  const allMessages: any[] = []
  let totalFromDB = 0
  
  // Strategy 1: Read from dedicated WhatsApp table
  try {
    const whatsappResult = await query(`
      SELECT *
      FROM whatsapp_messages
      ORDER BY timestamp DESC
      LIMIT 100
    `)
    
    if (whatsappResult.rows.length > 0) {
      console.log(`✅ Found ${whatsappResult.rows.length} messages in whatsapp_messages table`)
      allMessages.push(...whatsappResult.rows.map((msg: any) => ({
        source: 'whatsapp_messages_table',
        id: msg.id,
        message_id: msg.message_id,
        from_phone: msg.from_phone,
        content: msg.content,
        timestamp: msg.timestamp,
        message_type: msg.message_type,
        raw_data: msg.raw_data
      })))
      totalFromDB += whatsappResult.rows.length
    } else {
      console.log('⚠️ No messages in whatsapp_messages table')
    }
  } catch (error: any) {
    console.log('❌ whatsapp_messages table not accessible:', error.message)
  }

  // Strategy 2: Read from communications table
  try {
    const commResult = await query(`
      SELECT *
      FROM communications
      WHERE platform = 'whatsapp'
      ORDER BY timestamp DESC
      LIMIT 100
    `)
    
    if (commResult.rows.length > 0) {
      console.log(`✅ Found ${commResult.rows.length} WhatsApp messages in communications table`)
      allMessages.push(...commResult.rows.map((msg: any) => ({
        source: 'communications_table',
        id: msg.id,
        message_id: msg.message_id,
        from_phone: msg.from_phone,
        content: msg.content,
        timestamp: msg.timestamp,
        message_type: msg.message_type,
        raw_data: msg.raw_data
      })))
      totalFromDB += commResult.rows.length
    } else {
      console.log('⚠️ No WhatsApp messages in communications table')
    }
  } catch (error: any) {
    console.log('❌ communications table not accessible:', error.message)
  }

  // Strategy 3: Read from leads table (WhatsApp contacts)
  try {
    const leadsResult = await query(`
      SELECT *
      FROM leads
      WHERE source = 'whatsapp'
      ORDER BY created_at DESC
      LIMIT 50
    `)
    
    if (leadsResult.rows.length > 0) {
      console.log(`✅ Found ${leadsResult.rows.length} WhatsApp leads in leads table`)
      allMessages.push(...leadsResult.rows.map((lead: any) => ({
        source: 'leads_table',
        id: lead.id,
        message_id: `lead_${lead.id}`,
        from_phone: lead.phone,
        content: lead.notes || `WhatsApp contact: ${lead.name}`,
        timestamp: lead.created_at,
        message_type: 'contact_info',
        raw_data: lead.raw_data,
        name: lead.name,
        email: lead.email,
        status: lead.status
      })))
      totalFromDB += leadsResult.rows.length
    } else {
      console.log('⚠️ No WhatsApp leads in leads table')
    }
  } catch (error: any) {
    console.log('❌ leads table not accessible:', error.message)
  }

  // Remove duplicates based on message_id
  const uniqueMessages = allMessages.reduce((acc: any[], msg: any) => {
    if (!acc.find((existing: any) => existing.message_id === msg.message_id)) {
      acc.push(msg)
    }
    return acc
  }, [] as any[])

  // Sort by timestamp (newest first)
  uniqueMessages.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  console.log(`\n📊 [AI SIMPLE TEST] AI DATA SUMMARY via PostgreSQL:`)
  console.log(`- Database messages: ${totalFromDB}`)
  console.log(`- Total unique messages: ${uniqueMessages.length}`)
  console.log(`- Sources: ${[...new Set(uniqueMessages.map((m: any) => m.source))].join(', ')}`)

  return uniqueMessages
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n🤖 [AI SIMPLE TEST] AI SIMPLE TEST - READING ALL BUSINESS DATA via PostgreSQL')
    
    const { message } = await request.json()
    console.log(`📝 User query: ${message}`)

    // **STEP 1: READ ALL WHATSAPP MESSAGES FROM DATABASE**
    const allWhatsAppMessages = await getAllWhatsAppMessages()

    // **STEP 2: PREPARE AI CONTEXT WITH COMPLETE KNOWLEDGE**
    let aiContext = `You are a Universal Business Intelligence AI with access to complete business knowledge.

📱 WHATSAPP MESSAGES (Total: ${allWhatsAppMessages.length}):
`

    if (allWhatsAppMessages.length === 0) {
      aiContext += '❌ NO WHATSAPP MESSAGES FOUND - This indicates a problem with database storage!\n\n'
    } else {
      allWhatsAppMessages.slice(0, 10).forEach((msg: any, index: number) => {
        aiContext += `
${index + 1}. 📞 From: ${msg.from_phone}
   💬 Message: "${msg.content}"
   🕐 Time: ${new Date(msg.timestamp).toLocaleString()}
   📊 Source: ${msg.source}
   ${msg.name ? `👤 Name: ${msg.name}` : ''}
`
      })
      
      if (allWhatsAppMessages.length > 10) {
        aiContext += `\n... and ${allWhatsAppMessages.length - 10} more messages\n`
      }
    }

    aiContext += `
🎯 USER QUESTION: ${message}

Please analyze all the WhatsApp data and provide intelligent business insights. Include:
1. What you can see from the WhatsApp messages
2. Any patterns or insights about the clients
3. Actionable recommendations
4. Your confidence level in the data (0-1)

Be specific about what messages you can access and analyze.`

    // **STEP 3: RETURN ANALYSIS (Simplified for testing)**
    return NextResponse.json({
      success: true,
      message: 'AI Simple Test completed via PostgreSQL',
      database: 'PostgreSQL',
      analysis: {
        totalMessages: allWhatsAppMessages.length,
        sources: [...new Set(allWhatsAppMessages.map((m: any) => m.source))],
        recentMessages: allWhatsAppMessages.slice(0, 5),
        userQuery: message,
        aiContext: aiContext.substring(0, 500) + '...'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [AI SIMPLE TEST] Error (PostgreSQL):', error)
    return NextResponse.json({
      error: 'AI Simple Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🤖 [AI SIMPLE TEST] GET request - Testing PostgreSQL connectivity')
    
    // Simple test query
    const result = await query('SELECT COUNT(*) as count FROM ai_tasks LIMIT 1')
    
    return NextResponse.json({
      success: true,
      message: 'AI Simple Test GET endpoint working via PostgreSQL',
      database: 'PostgreSQL',
      testResult: {
        aiTasksCount: result.rows[0]?.count || 0
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ [AI SIMPLE TEST] GET Error (PostgreSQL):', error)
    return NextResponse.json({
      error: 'AI Simple Test GET failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 