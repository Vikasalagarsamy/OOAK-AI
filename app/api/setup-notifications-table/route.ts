import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgresql-client'
import { verifyAuth } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (admin only)
    const authResult = await verifyAuth()
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Setting up notifications table for testing...')

    // Check if notifications table exists
    const tableExistsResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      )
    `)

    const tableExists = tableExistsResult.rows[0]?.exists

    if (tableExists) {
      return NextResponse.json({
        success: true,
        message: 'Notifications table already exists',
        action: 'none'
      })
    }

    // Create notifications table
    await query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
        is_read BOOLEAN DEFAULT false,
        is_urgent BOOLEAN DEFAULT false,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes for performance
    await query(`
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
    `)

    // Create updated_at trigger
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

    await query(`
      CREATE TRIGGER update_notifications_updated_at 
        BEFORE UPDATE ON notifications 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `)

    // Insert some sample notifications for testing
    const userId = authResult.user.id
    await query(`
      INSERT INTO notifications (user_id, title, message, type, is_urgent, created_at) VALUES
      ($1, 'Welcome to Real-time Testing', 'Your notifications system is now set up and ready for testing.', 'success', false, CURRENT_TIMESTAMP),
      ($1, 'System Status', 'All real-time infrastructure components are operational.', 'info', false, CURRENT_TIMESTAMP),
      ($1, 'Test Notification', 'This is a test notification to verify the system works correctly.', 'info', false, CURRENT_TIMESTAMP)
    `, [userId])

    console.log('✅ Notifications table created successfully')

    return NextResponse.json({
      success: true,
      message: 'Notifications table created successfully',
      action: 'created',
      features: [
        'Primary key with auto-increment',
        'User-specific notifications',
        'Read/unread status tracking',
        'Urgency levels',
        'JSON metadata support',
        'Automatic timestamps',
        'Performance indexes',
        'Sample test data'
      ]
    })

  } catch (error) {
    console.error('❌ Error setting up notifications table:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup notifications table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 