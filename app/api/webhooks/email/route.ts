import { pool } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'
import { UniversalBusinessIntelligenceService } from '@/services/universal-business-intelligence-service'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

const universalBI = new UniversalBusinessIntelligenceService()

// Email Webhook Handler - PostgreSQL Migration
export async function POST(request: NextRequest) {
  console.log('📧 Email webhook received (PostgreSQL)')
  
  let client
  try {
    client = await pool.connect()
    
    const body = await request.json()
    console.log('📥 Email webhook data:', JSON.stringify(body, null, 2))

    // Determine email source and process accordingly
    if (body.subscription) {
      // Gmail Push Notification
      await handleGmailNotification(client, body)
    } else if (body.message) {
      // Gmail API message
      await handleGmailMessage(client, body.message)
    } else if (body.from && body.to) {
      // Direct email processing
      await processEmailDirect(client, body)
    } else {
      console.log('⚠️ Unknown email webhook format')
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Email webhook processed successfully',
      
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Email webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      
    }, { status: 500 })
  } finally {
    if (client) {
      client.release()
    }
  }
}

async function handleGmailNotification(client: any, notificationData: any) {
  console.log('📮 Handling Gmail notification (PostgreSQL)')

  try {
    await client.query('BEGIN')

    // Gmail sends notifications when emails are received
    // The actual email content needs to be fetched using Gmail API
    const message = notificationData.message
    
    if (message && message.data) {
      // Decode the base64 data
      const decodedData = Buffer.from(message.data, 'base64').toString()
      const pushData = JSON.parse(decodedData)

      console.log('📨 Gmail push data:', pushData)

      // Store Gmail notification in communications table
      const communicationQuery = `
        INSERT INTO communications (
          channel_type, message_id, sender_type, sender_id, sender_name,
          recipient_type, recipient_id, recipient_name, content_type, content_text,
          content_metadata, business_context, ai_processed, ai_priority_score,
          sent_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING id
      `
      
      const commResult = await client.query(communicationQuery, [
        'email',
        `gmail_${pushData.historyId || Date.now()}`,
        'client',
        pushData.emailAddress || 'unknown',
        'Gmail User',
        'employee',
        process.env.BUSINESS_EMAIL || 'business@ooak.photography',
        'Business Email',
        'text',
        'New Gmail notification received - needs processing',
        JSON.stringify({
          notification_type: 'gmail_push',
          history_id: pushData.historyId,
          subscription: notificationData.subscription
        }),
        'email_notification',
        false,
        0.5,
        new Date().toISOString()
      ])

      await client.query('COMMIT')
      console.log('✅ Gmail notification recorded in PostgreSQL:', commResult.rows[0].id)
    }

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error handling Gmail notification:', error)
  }
}

async function handleGmailMessage(client: any, messageData: any) {
  console.log('📨 Handling Gmail message (PostgreSQL)')

  try {
    await client.query('BEGIN')

    // Process Gmail API message format
    const headers = messageData.payload?.headers || []
    const fromHeader = headers.find((h: any) => h.name === 'From')
    const toHeader = headers.find((h: any) => h.name === 'To')
    const subjectHeader = headers.find((h: any) => h.name === 'Subject')
    const dateHeader = headers.find((h: any) => h.name === 'Date')

    const fromEmail = fromHeader?.value || 'unknown@unknown.com'
    const toEmail = toHeader?.value || process.env.BUSINESS_EMAIL || 'business@ooak.photography'
    const subject = subjectHeader?.value || 'No Subject'
    const receivedDate = dateHeader?.value || new Date().toISOString()

    // Extract body text
    let bodyText = ''
    if (messageData.payload?.body?.data) {
      bodyText = Buffer.from(messageData.payload.body.data, 'base64').toString()
    } else if (messageData.payload?.parts) {
      // Handle multipart messages
      for (const part of messageData.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          bodyText += Buffer.from(part.body.data, 'base64').toString()
        }
      }
    }

    const isFromClient = !isBusinessEmail(fromEmail)

    // Store email in communications table
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
      'email',
      messageData.id || `email_${Date.now()}`,
      isFromClient ? 'client' : 'employee',
      fromEmail,
      extractNameFromEmail(fromEmail),
      isFromClient ? 'employee' : 'client',
      toEmail,
      extractNameFromEmail(toEmail),
      'text',
      bodyText || subject,
      JSON.stringify({
        subject,
        gmail_message_id: messageData.id,
        gmail_thread_id: messageData.threadId,
        label_ids: messageData.labelIds
      }),
      'email_message',
      false,
      isFromClient ? 0.7 : 0.4,
      receivedDate
    ])

    await client.query('COMMIT')
    console.log('✅ Gmail message processed in PostgreSQL:', commResult.rows[0].id)

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error handling Gmail message:', error)
  }
}

async function processEmailDirect(client: any, emailData: any) {
  console.log('📧 Processing direct email data (PostgreSQL)')

  try {
    await client.query('BEGIN')

    // Direct email processing (for testing or custom integrations)
    const isFromClient = !isBusinessEmail(emailData.from)

    // Store email in communications table
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
      'email',
      emailData.messageId || `email_${Date.now()}`,
      isFromClient ? 'client' : 'employee',
      emailData.from,
      extractNameFromEmail(emailData.from),
      isFromClient ? 'employee' : 'client',
      emailData.to,
      extractNameFromEmail(emailData.to),
      'text',
      emailData.body || emailData.text || emailData.subject || '',
      JSON.stringify({
        subject: emailData.subject || 'No Subject',
        direct_processing: true,
        timestamp: emailData.timestamp
      }),
      'direct_email',
      false,
      isFromClient ? 0.6 : 0.3,
      emailData.timestamp || new Date().toISOString()
    ])

    await client.query('COMMIT')
    console.log('✅ Direct email processed in PostgreSQL:', commResult.rows[0].id)

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error processing direct email:', error)
  }
}

function isBusinessEmail(email: string): boolean {
  if (!email) return false
  
  const businessDomains = [
    'ooak.photography',
    'ooakphotography.com',
    'your-business-domain.com'
  ]
  
  const domain = email.split('@')[1]?.toLowerCase()
  return businessDomains.includes(domain || '')
}

function extractNameFromEmail(email: string): string {
  if (!email) return 'Unknown'
  
  // Extract name from email format "Name <email@domain.com>" or just use email part
  const nameMatch = email.match(/^([^<]+)</)
  if (nameMatch) {
    return nameMatch[1].trim()
  }
  
  // Use the part before @ as name
  const localPart = email.split('@')[0]
  return localPart.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Get email webhook status - PostgreSQL Migration
export async function GET() {
  let client
  try {
    client = await pool.connect()
    
    // Get email statistics from PostgreSQL
    const statsQuery = `
      SELECT 
        COUNT(*) as total_emails,
        COUNT(CASE WHEN sender_type = 'client' THEN 1 END) as client_emails,
        COUNT(CASE WHEN sender_type = 'employee' THEN 1 END) as employee_emails,
        COUNT(CASE WHEN ai_processed = true THEN 1 END) as ai_processed_emails,
        COUNT(CASE WHEN content_metadata::jsonb->>'subject' IS NOT NULL THEN 1 END) as emails_with_subject
      FROM communications
      WHERE channel_type = 'email'
    `
    
    const statsResult = await client.query(statsQuery)
    const stats = statsResult.rows[0]

    // Get recent emails
    const recentEmailsQuery = `
      SELECT 
        id, message_id, sender_type, sender_id, sender_name,
        recipient_id, recipient_name, content_text, content_metadata,
        ai_processed, sent_at
      FROM communications
      WHERE channel_type = 'email'
      ORDER BY sent_at DESC
      LIMIT 10
    `
    
    const recentResult = await client.query(recentEmailsQuery)
    const recentEmails = recentResult.rows.map(row => ({
      id: row.id,
      messageId: row.message_id,
      senderType: row.sender_type,
      senderId: row.sender_id,
      senderName: row.sender_name,
      recipientId: row.recipient_id,
      recipientName: row.recipient_name,
      subject: row.content_metadata?.subject || 'No Subject',
      contentPreview: (row.content_text || '').substring(0, 100) + '...',
      aiProcessed: row.ai_processed,
      sentAt: row.sent_at
    }))

    return NextResponse.json({
      message: 'Email Webhook Endpoint (PostgreSQL)',
      description: 'Processes email notifications and messages with PostgreSQL backend',
      
      supported_sources: [
        'Gmail Push Notifications',
        'Gmail API Messages',
        'Direct Email Processing'
      ],
      statistics: {
        total_emails: parseInt(stats.total_emails) || 0,
        client_emails: parseInt(stats.client_emails) || 0,
        employee_emails: parseInt(stats.employee_emails) || 0,
        ai_processed_emails: parseInt(stats.ai_processed_emails) || 0,
        emails_with_subject: parseInt(stats.emails_with_subject) || 0
      },
      recent_emails: recentEmails,
      ai_features: [
        'Business email detection',
        'Automatic sender classification',
        'Content analysis preparation',
        'Integration with business context'
      ]
    })

  } catch (error) {
    console.error('❌ Error getting email webhook status:', error)
    return NextResponse.json({
      message: 'Email Webhook Endpoint (PostgreSQL)',
      description: 'Processes email communications with PostgreSQL backend',
      
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    if (client) {
      client.release()
    }
  }
}