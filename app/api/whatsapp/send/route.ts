import { pool } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp-service'
import jwt from 'jsonwebtoken'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

// Get current user from JWT token - PostgreSQL Migration
async function getCurrentUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId || decoded.sub

    if (!userId) {
      return null
    }

    const client = await pool.connect()
    try {
      // Get user details from PostgreSQL
      const userQuery = `
        SELECT e.id, e.employee_code, e.first_name, e.last_name, e.email, e.department_id,
               d.name as department_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.id = $1
      `
      
      const userResult = await client.query(userQuery, [userId])
      
      if (userResult.rows.length === 0) {
        return null
      }

      const user = userResult.rows[0]
      
      return {
        id: user.id,
        employeeCode: user.employee_code,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        departmentId: user.department_id,
        departmentName: user.department_name
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('❌ Error getting current user:', error)
    return null
  }
}

// WhatsApp Send API - PostgreSQL Migration
export async function POST(req: NextRequest) {
  let client
  try {
    // Get current user with PostgreSQL authentication
    const currentUser = await getCurrentUser(req)
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        
      }, { status: 401 })
    }

    console.log(`📱 WhatsApp send request from user: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeCode})`)

    const { userId, phoneNumber, message, notificationId, templateId } = await req.json()

    if (!userId || !phoneNumber || !message) {
      return NextResponse.json({
        error: 'Missing required fields: userId, phoneNumber, message',
        
      }, { status: 400 })
    }

    // Validate phone number format
    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s+/g, ''))) {
      return NextResponse.json({
        error: 'Invalid phone number format',
        
      }, { status: 400 })
    }

    client = await pool.connect()
    await client.query('BEGIN')

    // Log WhatsApp message attempt in PostgreSQL
    const logQuery = `
      INSERT INTO whatsapp_messages (
        message_id, from_employee_id, to_phone, content, message_type,
        notification_id, template_id, status, timestamp, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, message_id
    `
    
    const messageId = `whatsapp_${Date.now()}_${currentUser.id}`
    const logResult = await client.query(logQuery, [
      messageId,
      currentUser.id,
      phoneNumber,
      message,
      'text',
      notificationId || null,
      templateId || null,
      'sending'
    ])

    const loggedMessageId = logResult.rows[0].id

    // Send WhatsApp message using service
    const result = await whatsappService.sendMessage({
      userId: currentUser.id,
      phoneNumber,
      messageContent: message,
      notificationId,
      templateId
    })

    if (result.success) {
      // Update message status to sent
      await client.query(
        'UPDATE whatsapp_messages SET status = $1, external_message_id = $2, updated_at = NOW() WHERE id = $3',
        ['sent', result.messageId, loggedMessageId]
      )

      // Log successful communication
      const communicationQuery = `
        INSERT INTO communications (
          channel_type, message_id, sender_type, sender_id, sender_name,
          recipient_type, recipient_id, recipient_name, content_type, content_text,
          content_metadata, business_context, ai_processed, ai_priority_score,
          sent_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING id
      `
      
      await client.query(communicationQuery, [
        'whatsapp',
        messageId,
        'employee',
        currentUser.id.toString(),
        `${currentUser.firstName} ${currentUser.lastName}`,
        'client',
        phoneNumber,
        'Client',
        'text',
        message,
        JSON.stringify({
          notification_id: notificationId,
          template_id: templateId,
          external_message_id: result.messageId
        }),
        'outbound_message',
        false,
        0.7,
        new Date().toISOString()
      ])

      await client.query('COMMIT')

      console.log(`✅ WhatsApp message sent successfully to ${phoneNumber} by ${currentUser.employeeCode}`)

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'WhatsApp message sent successfully',
        
        logged_message_id: loggedMessageId
      })
    } else {
      // Update message status to failed
      await client.query(
        'UPDATE whatsapp_messages SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
        ['failed', result.error, loggedMessageId]
      )

      await client.query('COMMIT')

      console.error(`❌ WhatsApp message send failed for ${phoneNumber}:`, result.error)

      return NextResponse.json({
        error: result.error,
        
        logged_message_id: loggedMessageId
      }, { status: 500 })
    }

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK')
    }
    console.error('❌ WhatsApp send API error:', error)
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

// Get WhatsApp message history - PostgreSQL Migration
export async function GET(req: NextRequest) {
  let client
  try {
    const currentUser = await getCurrentUser(req)
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        
      }, { status: 401 })
    }

    const url = new URL(req.url)
    const phoneNumber = url.searchParams.get('phoneNumber')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    client = await pool.connect()

    let query = `
      SELECT 
        wm.id,
        wm.message_id,
        wm.from_employee_id,
        wm.to_phone,
        wm.content,
        wm.message_type,
        wm.status,
        wm.timestamp,
        wm.external_message_id,
        wm.error_message,
        e.first_name,
        e.last_name,
        e.employee_code
      FROM whatsapp_messages wm
      LEFT JOIN employees e ON wm.from_employee_id = e.id
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramCount = 0

    if (phoneNumber) {
      paramCount++
      query += ` AND wm.to_phone = $${paramCount}`
      params.push(phoneNumber)
    }

    query += ` ORDER BY wm.timestamp DESC`
    
    paramCount++
    query += ` LIMIT $${paramCount}`
    params.push(limit)
    
    paramCount++
    query += ` OFFSET $${paramCount}`
    params.push(offset)

    const result = await client.query(query, params)

    // Format the results
    const messages = result.rows.map(row => ({
      id: row.id,
      messageId: row.message_id,
      fromEmployee: {
        id: row.from_employee_id,
        firstName: row.first_name,
        lastName: row.last_name,
        employeeCode: row.employee_code
      },
      toPhone: row.to_phone,
      content: row.content,
      messageType: row.message_type,
      status: row.status,
      timestamp: row.timestamp,
      externalMessageId: row.external_message_id,
      errorMessage: row.error_message
    }))

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM whatsapp_messages wm
      WHERE 1=1
    `
    
    const countParams: any[] = []
    if (phoneNumber) {
      countQuery += ` AND wm.to_phone = $1`
      countParams.push(phoneNumber)
    }

    const countResult = await client.query(countQuery, countParams)
    const totalCount = parseInt(countResult.rows[0].total)

    return NextResponse.json({
      success: true,
      messages,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      
    })

  } catch (error) {
    console.error('❌ Error getting WhatsApp message history:', error)
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