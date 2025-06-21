import { pool } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function POST(request: NextRequest) {
  console.log('🧪 Adding test data to Universal Business Intelligence with PostgreSQL')
  
  const client = await pool.connect()
  const startTime = Date.now()
  
  try {
    // Start transaction for data consistency
    await client.query('BEGIN')
    
    // Check if tables exist and create them if needed
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_entities (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_status VARCHAR(20) DEFAULT 'active',
        name VARCHAR(255) NOT NULL,
        primary_phone VARCHAR(20),
        email VARCHAR(255),
        company_name VARCHAR(255),
        acquisition_source VARCHAR(100),
        communication_preferences JSONB,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        content_type VARCHAR(100) NOT NULL,
        source_type VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT,
        summary TEXT,
        business_area VARCHAR(100),
        relevance_tags TEXT[],
        importance_score DECIMAL(3,2) DEFAULT 0.5,
        visibility VARCHAR(20) DEFAULT 'internal',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS communications (
        id SERIAL PRIMARY KEY,
        channel_type VARCHAR(50) NOT NULL,
        sender_type VARCHAR(50) NOT NULL,
        sender_id VARCHAR(100),
        sender_name VARCHAR(255),
        recipient_type VARCHAR(50) NOT NULL,
        recipient_id VARCHAR(100),
        recipient_name VARCHAR(255),
        content_type VARCHAR(50) NOT NULL,
        content_text TEXT,
        business_context VARCHAR(100),
        ai_processed BOOLEAN DEFAULT false,
        ai_intent VARCHAR(100),
        ai_sentiment VARCHAR(50),
        ai_keywords TEXT[],
        ai_priority_score DECIMAL(3,2) DEFAULT 0.5,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_context_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        session_name VARCHAR(255),
        context_summary TEXT,
        active_entities INTEGER[],
        conversation_history JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    console.log('✅ Database tables verified/created')

    // Add a sample business entity with enhanced PostgreSQL features
    const { rows: entityRows } = await client.query(`
      INSERT INTO business_entities (
        entity_type, entity_status, name, primary_phone, email, 
        company_name, acquisition_source, communication_preferences, tags
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING id, name, created_at
    `, [
      'client',
      'active',
      'Ramya Krishnan',
      '+91-9876543210',
      'ramya.krishnan@example.com',
      'Wedding Planning Co',
      'Instagram',
      JSON.stringify({ preferred_channel: 'whatsapp', best_time: 'evening' }),
      ['wedding', 'premium_client', 'instagram_lead']
    ])

    const entity = entityRows[0]
    console.log(`✅ Created business entity: ${entity.name} (ID: ${entity.id})`)

    // Add sample knowledge base entry with full-text search optimization
    const { rows: knowledgeRows } = await client.query(`
      INSERT INTO knowledge_base (
        content_type, source_type, title, content, summary, 
        business_area, relevance_tags, importance_score, visibility
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING id, title, created_at
    `, [
      'client_project',
      'internal',
      'Ramya\'s Wedding Photography Project',
      `Wedding photography project for Ramya Krishnan:
- Event Date: December 15, 2024
- Location: Chennai, Tamil Nadu
- Services: Pre-wedding, Wedding ceremony, Reception
- Package: Premium Wedding Package
- Amount: ₹85,000
- Status: Confirmed and paid
- Special Requirements: Traditional South Indian ceremony coverage
- Team Assigned: Lead photographer + 2 assistants
- Deliverables: 500+ edited photos, highlight video, same-day edit`,
      'Premium wedding photography project for Ramya Krishnan worth ₹85,000',
      'photography',
      ['wedding', 'photography', 'premium', 'confirmed'],
      0.9,
      'internal'
    ])

    const knowledge = knowledgeRows[0]
    console.log(`✅ Created knowledge entry: ${knowledge.title} (ID: ${knowledge.id})`)

    // Add sample communications with batch insert for performance
    const communications = [
      [
        'whatsapp', 'client', '+91-9876543210', 'Ramya Krishnan',
        'employee', '+91-9876543211', 'Photography Team', 'text',
        'Hi! I saw your Instagram page and I\'m interested in wedding photography for December 15th. Can you share your packages?',
        'lead_inquiry', true, 'package_inquiry', 'positive',
        ['wedding', 'photography', 'packages', 'december'], 0.8, '2024-11-01T10:30:00Z'
      ],
      [
        'whatsapp', 'employee', '+91-9876543211', 'Photography Team',
        'client', '+91-9876543210', 'Ramya Krishnan', 'text',
        'Hello Ramya! Thank you for your interest. We have several wedding packages. Our Premium package at ₹85,000 includes pre-wedding, ceremony, and reception coverage with 500+ edited photos and videos. Would you like to discuss this further?',
        'package_presentation', true, 'package_offer', 'professional',
        ['premium', 'package', '85000', 'photos', 'videos'], 0.7, '2024-11-01T11:15:00Z'
      ],
      [
        'whatsapp', 'client', '+91-9876543210', 'Ramya Krishnan',
        'employee', '+91-9876543211', 'Photography Team', 'text',
        'Perfect! The premium package sounds exactly what we need. Can we schedule a call to finalize the details? Also, do you have availability for December 15th?',
        'booking_confirmation', true, 'booking_request', 'positive',
        ['premium', 'package', 'schedule', 'call', 'december', '15th'], 0.9, '2024-11-01T14:20:00Z'
      ]
    ]

    const { rows: commRows } = await client.query(`
      INSERT INTO communications (
        channel_type, sender_type, sender_id, sender_name,
        recipient_type, recipient_id, recipient_name, content_type,
        content_text, business_context, ai_processed, ai_intent,
        ai_sentiment, ai_keywords, ai_priority_score, sent_at
      ) VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16),
        ($17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32),
        ($33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48)
      RETURNING id, content_text, ai_priority_score
    `, communications.flat())

    console.log(`✅ Created ${commRows.length} communication records`)

    // Add AI context session with PostgreSQL array handling
    const { rows: sessionRows } = await client.query(`
      INSERT INTO ai_context_sessions (
        user_id, session_name, context_summary, active_entities, conversation_history
      ) VALUES (
        $1, $2, $3, $4, $5
      ) RETURNING id, session_name, created_at
    `, [
      'test-user',
      'Business Intelligence Test',
      'Testing Universal Business Intelligence with Ramya\'s wedding project',
      [entity.id],
      JSON.stringify([
        {
          query: 'Tell me about Ramya\'s project',
          response: 'Ramya Krishnan has a confirmed wedding photography project for December 15th worth ₹85,000',
          timestamp: new Date().toISOString()
        }
      ])
    ])

    const session = sessionRows[0]
    console.log(`✅ Created AI context session: ${session.session_name} (ID: ${session.id})`)

    // Commit transaction
    await client.query('COMMIT')
    
    const totalTime = Date.now() - startTime

    // Generate analytics about the test data
    const { rows: analytics } = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM business_entities) as total_entities,
        (SELECT COUNT(*) FROM knowledge_base) as total_knowledge,
        (SELECT COUNT(*) FROM communications) as total_communications,
        (SELECT COUNT(*) FROM ai_context_sessions) as total_sessions,
        (SELECT AVG(ai_priority_score) FROM communications WHERE ai_processed = true) as avg_ai_priority,
        (SELECT array_agg(DISTINCT ai_intent) FROM communications WHERE ai_intent IS NOT NULL) as unique_intents
    `)

    return NextResponse.json({
      success: true,
      message: '🧪 Test data added successfully to PostgreSQL!',
      performance: {
        total_time: `${totalTime}ms`,
        database: 'PostgreSQL localhost:5432',
        transaction_safe: true
      },
      data: {
        entity_created: true,
        entity_details: {
          id: entity.id,
          name: entity.name,
          created_at: entity.created_at
        },
        knowledge_created: true,
        knowledge_details: {
          id: knowledge.id,
          title: knowledge.title,
          created_at: knowledge.created_at
        },
        communications_created: commRows.length,
        communications_summary: {
          avg_priority: parseFloat(analytics[0].avg_ai_priority || 0).toFixed(2),
          unique_intents: analytics[0].unique_intents || []
        },
        session_created: true,
        session_details: {
          id: session.id,
          name: session.session_name,
          created_at: session.created_at
        }
      },
      database_analytics: {
        total_entities: parseInt(analytics[0].total_entities),
        total_knowledge: parseInt(analytics[0].total_knowledge),
        total_communications: parseInt(analytics[0].total_communications),
        total_sessions: parseInt(analytics[0].total_sessions)
      },
      test_queries: [
        'What\'s the status of Ramya\'s wedding project?',
        'Tell me about our recent WhatsApp conversations',
        'What are our confirmed bookings for December?',
        'Show me details about the premium wedding package',
        'Analyze communication patterns for this client'
      ],
      postgresql_features: [
        'JSONB for structured data storage',
        'Array types for tags and keywords',
        'Full-text search capabilities',
        'Transaction safety with BEGIN/COMMIT',
        'Advanced analytics with window functions'
      ],
      metadata: {
        source: 'PostgreSQL Business Intelligence',
        database: 'PostgreSQL localhost:5432',
        created_at: new Date().toISOString(),
        version: '2.0'
      }
    })

  } catch (error: any) {
    // Rollback transaction on error
    await client.query('ROLLBACK')
    console.error('❌ Error adding PostgreSQL test data:', error)
    
    return NextResponse.json({
      success: false, 
      error: error.message || 'Unknown PostgreSQL error',
      details: {
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      message: 'Failed to add test data to PostgreSQL',
      database: 'PostgreSQL localhost:5432'
    }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function GET() {
  const client = await pool.connect()
  
  try {
    // Get comprehensive overview of test data
    const { rows: overview } = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM business_entities WHERE entity_type = 'client') as client_entities,
        (SELECT COUNT(*) FROM knowledge_base WHERE business_area = 'photography') as photography_knowledge,
        (SELECT COUNT(*) FROM communications WHERE channel_type = 'whatsapp') as whatsapp_communications,
        (SELECT COUNT(*) FROM ai_context_sessions) as ai_sessions,
        (SELECT MAX(created_at) FROM business_entities) as latest_entity,
        (SELECT array_agg(DISTINCT ai_sentiment) FROM communications WHERE ai_sentiment IS NOT NULL) as sentiment_types
    `)

    return NextResponse.json({
      message: 'Universal Business Intelligence Test Data - PostgreSQL Enhanced',
      description: 'POST to add comprehensive sample data for testing the AI system',
      database: 'PostgreSQL localhost:5432',
      current_status: {
        client_entities: parseInt(overview[0].client_entities || 0),
        photography_knowledge: parseInt(overview[0].photography_knowledge || 0),
        whatsapp_communications: parseInt(overview[0].whatsapp_communications || 0),
        ai_sessions: parseInt(overview[0].ai_sessions || 0),
        latest_entity_created: overview[0].latest_entity,
        sentiment_analysis: overview[0].sentiment_types || []
      },
      features: [
        'PostgreSQL JSONB for flexible data structures',
        'Array types for tags and multi-value fields',
        'Transaction safety for data consistency',
        'Advanced analytics and aggregations',
        'Full-text search capabilities',
        'AI-powered business intelligence'
      ],
      connection_pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      message: 'Universal Business Intelligence Test Data',
      error: 'Failed to get overview',
      details: error.message,
      database: 'PostgreSQL localhost:5432'
    }, { status: 500 })
  } finally {
    client.release()
  }
} 