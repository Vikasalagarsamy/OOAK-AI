import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// 📖 Mark notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id
    
    if (!notificationId || notificationId.trim() === '') {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 })
    }

    console.log('🐘 Marking notification as read in PostgreSQL:', notificationId)

    const client = await pool.connect()
    
    // Update the notification to mark as read
    const query = `
      UPDATE notifications 
      SET is_read = true
      WHERE id = $1
      RETURNING id, is_read
    `
    
    const result = await client.query(query, [notificationId])
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    console.log('✅ Notification marked as read successfully in PostgreSQL:', notificationId)

    return NextResponse.json({ 
      success: true,
      message: 'Notification marked as read',
      notification: result.rows[0],
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error in notification read endpoint:', error)
    return NextResponse.json({
      error: error.message || 'Unknown error',
      details: error.message
    }, { status: 500 })
  }
} 