import { pool } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

// Setup WhatsApp Table - PostgreSQL Migration (Compatible with existing schema)
export async function POST(request: NextRequest) {
  console.log('🔧 Setting up WhatsApp table for real-time testing (PostgreSQL)...')
  
  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')
    
    // Check if whatsapp_messages table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_messages'
      ) as table_exists
    `
    
    const tableResult = await client.query(checkTableQuery)
    const tableExists = tableResult.rows[0].table_exists

    if (!tableExists) {
      // Create the whatsapp_messages table with the business schema
      const createTableSQL = `
        CREATE TABLE whatsapp_messages (
          id SERIAL PRIMARY KEY,
          quotation_id INTEGER REFERENCES quotations(id),
          client_phone VARCHAR(20) NOT NULL,
          message_text TEXT NOT NULL,
          message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('incoming', 'outgoing')),
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          interakt_message_id VARCHAR(100) UNIQUE,
          media_url TEXT,
          media_type VARCHAR(50),
          ai_analyzed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX idx_whatsapp_messages_client_phone ON whatsapp_messages(client_phone);
        CREATE INDEX idx_whatsapp_messages_phone_timestamp ON whatsapp_messages(client_phone, timestamp DESC);
        CREATE INDEX idx_whatsapp_messages_quotation_timestamp ON whatsapp_messages(quotation_id, timestamp DESC);
        CREATE INDEX idx_whatsapp_messages_ai_analyzed ON whatsapp_messages(ai_analyzed) WHERE ai_analyzed = FALSE;
      `
      
      await client.query(createTableSQL)
      console.log('✅ WhatsApp messages table created successfully')
    } else {
      console.log('✅ WhatsApp messages table already exists')
    }

    // Create communications table if it doesn't exist (for enhanced analytics)
    const createCommunicationsTableSQL = `
      CREATE TABLE IF NOT EXISTS communications (
        id SERIAL PRIMARY KEY,
        channel_type VARCHAR(50) NOT NULL,
        message_id VARCHAR(255) NOT NULL,
        sender_type VARCHAR(50) NOT NULL,
        sender_id VARCHAR(100),
        sender_name VARCHAR(255),
        recipient_type VARCHAR(50) NOT NULL,
        recipient_id VARCHAR(100),
        recipient_name VARCHAR(255),
        content_type VARCHAR(50) NOT NULL,
        content_text TEXT,
        content_metadata JSONB,
        business_context VARCHAR(100),
        ai_processed BOOLEAN DEFAULT FALSE,
        ai_priority_score DECIMAL(3,2) DEFAULT 0.0,
        sent_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_communications_channel_type ON communications(channel_type);
      CREATE INDEX IF NOT EXISTS idx_communications_sender_type ON communications(sender_type);
      CREATE INDEX IF NOT EXISTS idx_communications_sent_at ON communications(sent_at);
      CREATE INDEX IF NOT EXISTS idx_communications_ai_processed ON communications(ai_processed);
    `
    
    await client.query(createCommunicationsTableSQL)
    console.log('✅ Communications table created/verified successfully')

    // Insert a test message using the existing schema
    const testMessageId = `setup_test_${Date.now()}`
    const insertTestQuery = `
      INSERT INTO whatsapp_messages (
        client_phone, message_text, message_type, timestamp, 
        interakt_message_id, ai_analyzed
      ) VALUES ($1, $2, $3, NOW(), $4, $5)
      RETURNING id, interakt_message_id, timestamp
    `
    
    const testResult = await client.query(insertTestQuery, [
      '919677362524',
      'WhatsApp table verified successfully! Ready for real-time testing with PostgreSQL and existing business schema.',
      'incoming',
      testMessageId,
      false
    ])

    const testMessage = testResult.rows[0]

    // Also create a test communication record
    const communicationQuery = `
      INSERT INTO communications (
        channel_type, message_id, sender_type, sender_id, sender_name,
        recipient_type, recipient_id, recipient_name, content_type, content_text,
        content_metadata, business_context, ai_processed, ai_priority_score,
        sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING id
    `
    
    const commResult = await client.query(communicationQuery, [
      'whatsapp',
      testMessageId,
      'client',
      '919677362524',
      'Test Client',
      'employee',
      'business',
      'Business',
      'text',
      'WhatsApp table verified successfully!',
      JSON.stringify({
        test_setup: true,
        table_schema: 'business_compatible'
      }),
      'setup_test',
      false,
      0.5
    ])

    await client.query('COMMIT')
    
    console.log('✅ WhatsApp table setup completed successfully with PostgreSQL!')
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp table verified and ready for real-time testing with PostgreSQL!',
      
      table_status: 'verified',
      schema_type: 'business_compatible',
      test_message: {
        id: testMessage.id,
        interaktMessageId: testMessage.interakt_message_id,
        timestamp: testMessage.timestamp
      },
      test_communication: {
        id: commResult.rows[0].id
      },
      tables_verified: [
        'whatsapp_messages (existing business schema)',
        'communications (analytics enhancement)'
      ],
      existing_indexes: [
        'idx_whatsapp_messages_client_phone',
        'idx_whatsapp_messages_phone_timestamp',
        'idx_whatsapp_messages_quotation_timestamp',
        'idx_whatsapp_messages_ai_analyzed'
      ],
      next_steps: {
        step1: 'Send WhatsApp message to +919677362524 from your phone',
        step2: 'Message will be stored in whatsapp_messages table',
        step3: 'AI will be able to read and analyze the message',
        step4: 'Check analytics in communications table',
        webhook_url: 'Use your webhook URL',
        test_endpoint: 'GET /api/setup-whatsapp-table'
      }
    })
    
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK')
    }
    console.error('❌ Error setting up WhatsApp table:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to set up WhatsApp table',
      
      error: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        common_issues: [
          'PostgreSQL connection failed',
          'Insufficient permissions',
          'Schema mismatch with existing table'
        ],
        solution: 'Check PostgreSQL connection and existing table schema'
      }
    }, { status: 500 })
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Check WhatsApp table status - PostgreSQL Migration (Compatible with existing schema)
export async function GET() {
  console.log('🔍 Checking WhatsApp table status (PostgreSQL)...')
  
  let client
  try {
    client = await pool.connect()
    
    // Check if whatsapp_messages table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_messages'
      ) as table_exists
    `
    
    const tableResult = await client.query(checkTableQuery)
    const tableExists = tableResult.rows[0].table_exists

    if (!tableExists) {
      return NextResponse.json({
        success: false,
        table_exists: false,
        
        message: 'WhatsApp messages table does not exist',
        action_needed: 'Run POST /api/setup-whatsapp-table to create the table'
      })
    }

    // Get recent messages using existing schema
    const messagesQuery = `
      SELECT 
        wm.id,
        wm.quotation_id,
        wm.client_phone,
        wm.message_text,
        wm.message_type,
        wm.timestamp,
        wm.interakt_message_id,
        wm.media_url,
        wm.media_type,
        wm.ai_analyzed,
        q.quotation_number,
        q.client_name
      FROM whatsapp_messages wm
      LEFT JOIN quotations q ON wm.quotation_id = q.id
      ORDER BY wm.timestamp DESC
      LIMIT 10
    `
    
    const messagesResult = await client.query(messagesQuery)
    
    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN message_type = 'incoming' THEN 1 END) as incoming_messages,
        COUNT(CASE WHEN message_type = 'outgoing' THEN 1 END) as outgoing_messages,
        COUNT(CASE WHEN ai_analyzed = true THEN 1 END) as ai_analyzed_messages,
        COUNT(CASE WHEN ai_analyzed = false THEN 1 END) as pending_analysis,
        COUNT(CASE WHEN quotation_id IS NOT NULL THEN 1 END) as linked_to_quotations
      FROM whatsapp_messages
    `
    
    const statsResult = await client.query(statsQuery)
    const stats = statsResult.rows[0]

    // Format messages
    const recentMessages = messagesResult.rows.map(row => ({
      id: row.id,
      quotationId: row.quotation_id,
      quotationNumber: row.quotation_number,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      messageText: row.message_text.substring(0, 100) + (row.message_text.length > 100 ? '...' : ''),
      messageType: row.message_type,
      timestamp: row.timestamp,
      interaktMessageId: row.interakt_message_id,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      aiAnalyzed: row.ai_analyzed
    }))

    // Check if communications table exists
    const commTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'communications'
      ) as communications_exists
    `
    
    const commTableResult = await client.query(commTableQuery)
    const communicationsExists = commTableResult.rows[0].communications_exists

    let communicationsStats = null
    if (communicationsExists) {
      const commStatsQuery = `
        SELECT 
          COUNT(*) as total_communications,
          COUNT(CASE WHEN channel_type = 'whatsapp' THEN 1 END) as whatsapp_communications
        FROM communications
      `
      const commStatsResult = await client.query(commStatsQuery)
      communicationsStats = commStatsResult.rows[0]
    }
    
    return NextResponse.json({
      success: true,
      table_exists: true,
      
      schema_type: 'business_compatible',
      statistics: {
        total_messages: parseInt(stats.total_messages) || 0,
        incoming_messages: parseInt(stats.incoming_messages) || 0,
        outgoing_messages: parseInt(stats.outgoing_messages) || 0,
        ai_analyzed_messages: parseInt(stats.ai_analyzed_messages) || 0,
        pending_analysis: parseInt(stats.pending_analysis) || 0,
        linked_to_quotations: parseInt(stats.linked_to_quotations) || 0,
        communications_table_exists: communicationsExists,
        total_communications: communicationsStats ? parseInt(communicationsStats.total_communications) : 0,
        whatsapp_communications: communicationsStats ? parseInt(communicationsStats.whatsapp_communications) : 0
      },
      recent_messages: recentMessages,
      status: 'WhatsApp table is ready for real-time testing with PostgreSQL (business schema)',
      instructions: {
        send_message: 'Send WhatsApp to +919677362524',
        test_ai: 'POST /api/ai-simple-test with message about WhatsApp',
        webhook_url: 'Configure your webhook URL for incoming messages',
        view_messages: 'GET /api/whatsapp/send?phoneNumber=<phone>',
        business_schema: 'Uses existing quotation-linked WhatsApp schema'
      }
    })
    
  } catch (error) {
    console.error('❌ Error checking WhatsApp table:', error)
    
    return NextResponse.json({
      success: false,
      
      message: 'Error checking WhatsApp table status',
      error: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        check_connection: 'Verify PostgreSQL is running on localhost:5432',
        check_permissions: 'Ensure user has SELECT permissions on public schema',
        schema_info: 'Table uses business schema with quotation_id links'
      }
    }, { status: 500 })
  } finally {
    if (client) {
      client.release()
    }
  }
} 