import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

export async function POST(request: NextRequest) {
  console.log('🌟 Setting up Universal Business Intelligence System')
  
  const results = {
    tables_created: 0,
    sample_data_inserted: 0,
    errors: [] as string[]
  }
  
  try {
    const client = await pool.connect()
    
    try {
      // Begin transaction for atomic setup
      await client.query('BEGIN')

      // Create the Universal Business Intelligence tables
      const createTableQueries = [
        // 1. Communications table
        `CREATE TABLE IF NOT EXISTS communications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('whatsapp', 'instagram', 'email', 'call', 'sms', 'internal')),
          message_id VARCHAR(255),
          thread_id VARCHAR(255),
          sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'employee', 'vendor', 'system')),
          sender_id VARCHAR(255),
          sender_name VARCHAR(255),
          recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('client', 'employee', 'vendor', 'system')),
          recipient_id VARCHAR(255),
          recipient_name VARCHAR(255),
          content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'audio', 'document', 'voice_note')),
          content_text TEXT,
          content_metadata JSONB DEFAULT '{}',
          business_context VARCHAR(50),
          related_lead_id INTEGER,
          related_quotation_id INTEGER,
          related_project_id INTEGER,
          ai_processed BOOLEAN DEFAULT false,
          ai_intent VARCHAR(100),
          ai_sentiment VARCHAR(20),
          ai_keywords TEXT[],
          ai_entities JSONB DEFAULT '{}',
          ai_priority_score DECIMAL(3,2) DEFAULT 0.5,
          sent_at TIMESTAMPTZ NOT NULL,
          delivered_at TIMESTAMPTZ,
          read_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,

        // 2. Business Entities table
        `CREATE TABLE IF NOT EXISTS business_entities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('client', 'employee', 'vendor', 'partner')),
          entity_status VARCHAR(20) DEFAULT 'active' CHECK (entity_status IN ('active', 'inactive', 'blocked')),
          name VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          primary_phone VARCHAR(50),
          whatsapp_number VARCHAR(50),
          instagram_handle VARCHAR(100),
          email VARCHAR(255),
          alternate_contacts JSONB DEFAULT '[]',
          company_name VARCHAR(255),
          designation VARCHAR(100),
          address JSONB,
          relationship_manager_id UUID,
          acquisition_source VARCHAR(100),
          communication_preferences JSONB DEFAULT '{}',
          interaction_history_summary TEXT,
          ai_personality_profile JSONB DEFAULT '{}',
          custom_fields JSONB DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,

        // 3. Knowledge Base table
        `CREATE TABLE IF NOT EXISTS knowledge_base (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content_type VARCHAR(50) NOT NULL,
          source_type VARCHAR(50) NOT NULL,
          source_id UUID,
          title VARCHAR(500),
          content TEXT NOT NULL,
          summary TEXT,
          business_area VARCHAR(100),
          relevance_tags TEXT[] DEFAULT '{}',
          entity_mentions UUID[],
          ai_keywords TEXT[],
          ai_categories TEXT[],
          importance_score DECIMAL(3,2) DEFAULT 0.5,
          visibility VARCHAR(20) DEFAULT 'internal' CHECK (visibility IN ('public', 'internal', 'confidential')),
          access_groups TEXT[] DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,

        // 4. AI Context Sessions table
        `CREATE TABLE IF NOT EXISTS ai_context_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_name VARCHAR(255),
          user_id VARCHAR(255) NOT NULL,
          active_contexts JSONB DEFAULT '[]',
          context_history JSONB DEFAULT '[]',
          current_intent VARCHAR(100),
          context_memory JSONB DEFAULT '{}',
          conversation_summary TEXT,
          session_status VARCHAR(20) DEFAULT 'active' CHECK (session_status IN ('active', 'paused', 'ended')),
          started_at TIMESTAMPTZ DEFAULT NOW(),
          last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
          ended_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,

        // 5. AI Query History table
        `CREATE TABLE IF NOT EXISTS ai_query_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID,
          user_query TEXT NOT NULL,
          query_intent VARCHAR(100),
          query_entities JSONB DEFAULT '{}',
          context_sources JSONB DEFAULT '[]',
          retrieved_communications INTEGER DEFAULT 0,
          retrieved_knowledge_items INTEGER DEFAULT 0,
          ai_response TEXT NOT NULL,
          response_confidence DECIMAL(3,2),
          response_sources TEXT[],
          processing_time_ms INTEGER,
          tokens_used INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`,

        // 6. Data Sync Status table
        `CREATE TABLE IF NOT EXISTS data_sync_status (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          platform VARCHAR(50) NOT NULL,
          account_id VARCHAR(255),
          last_sync_at TIMESTAMPTZ,
          last_successful_sync_at TIMESTAMPTZ,
          next_sync_scheduled_at TIMESTAMPTZ,
          total_items_synced INTEGER DEFAULT 0,
          items_synced_today INTEGER DEFAULT 0,
          last_sync_error TEXT,
          sync_enabled BOOLEAN DEFAULT true,
          sync_frequency_minutes INTEGER DEFAULT 15,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(platform, account_id)
        )`,

        // 7. Data Processing Queue table
        `CREATE TABLE IF NOT EXISTS data_processing_queue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_type VARCHAR(50) NOT NULL,
          priority INTEGER DEFAULT 5,
          source_table VARCHAR(50),
          source_id UUID,
          task_data JSONB NOT NULL,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
          attempts INTEGER DEFAULT 0,
          max_attempts INTEGER DEFAULT 3,
          result_data JSONB,
          error_message TEXT,
          scheduled_at TIMESTAMPTZ DEFAULT NOW(),
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`
      ]

      // Execute table creation queries
      for (let i = 0; i < createTableQueries.length; i++) {
        try {
          await client.query(createTableQueries[i])
          results.tables_created++
          console.log(`✅ Created table ${i + 1}/${createTableQueries.length}`)
        } catch (error: any) {
          console.error(`❌ Error creating table ${i + 1}:`, error.message)
          results.errors.push(`Table ${i + 1}: ${error.message}`)
        }
      }

      // Create indexes for performance
      const indexQueries = [
        `CREATE INDEX IF NOT EXISTS idx_communications_channel_type ON communications(channel_type)`,
        `CREATE INDEX IF NOT EXISTS idx_communications_sender_id ON communications(sender_id)`,
        `CREATE INDEX IF NOT EXISTS idx_communications_sent_at ON communications(sent_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_communications_business_context ON communications(business_context)`,
        `CREATE INDEX IF NOT EXISTS idx_business_entities_type ON business_entities(entity_type)`,
        `CREATE INDEX IF NOT EXISTS idx_business_entities_email ON business_entities(email)`,
        `CREATE INDEX IF NOT EXISTS idx_business_entities_phone ON business_entities(primary_phone)`,
        `CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_type ON knowledge_base(content_type)`,
        `CREATE INDEX IF NOT EXISTS idx_knowledge_base_business_area ON knowledge_base(business_area)`,
        `CREATE INDEX IF NOT EXISTS idx_ai_context_sessions_user ON ai_context_sessions(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_ai_context_sessions_status ON ai_context_sessions(session_status)`,
        `CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON data_processing_queue(status)`,
        `CREATE INDEX IF NOT EXISTS idx_processing_queue_priority ON data_processing_queue(priority)`,
        `CREATE INDEX IF NOT EXISTS idx_data_sync_platform ON data_sync_status(platform)`
      ]

      console.log('📊 Creating performance indexes...')
      for (let i = 0; i < indexQueries.length; i++) {
        try {
          await client.query(indexQueries[i])
          console.log(`✅ Created index ${i + 1}/${indexQueries.length}`)
        } catch (error: any) {
          console.error(`❌ Error creating index ${i + 1}:`, error.message)
          results.errors.push(`Index ${i + 1}: ${error.message}`)
        }
      }

      // Insert comprehensive sample data for all tables
      console.log('📝 Inserting sample data...')

      // Sample communications data
      const sampleCommunications = [
        {
          channel_type: 'whatsapp',
          sender_type: 'client',
          sender_name: 'Pooja Karthikeyan',
          recipient_type: 'employee',
          recipient_name: 'Vikas Sales Team',
          content_text: 'Hi, I am interested in wedding photography packages',
          business_context: 'lead_inquiry',
          ai_intent: 'package_inquiry',
          ai_sentiment: 'positive',
          ai_priority_score: 0.8
        },
        {
          channel_type: 'instagram',
          sender_type: 'client',
          sender_name: 'Lakshmi Priyanka',
          recipient_type: 'employee',
          recipient_name: 'OOAK Photography',
          content_text: 'Your portfolio looks amazing! What are your rates for engagement shoots?',
          business_context: 'service_inquiry',
          ai_intent: 'pricing_inquiry',
          ai_sentiment: 'positive',
          ai_priority_score: 0.75
        }
      ]

      for (const comm of sampleCommunications) {
        await client.query(`
          INSERT INTO communications (
            channel_type, sender_type, sender_name, recipient_type, recipient_name,
            content_text, business_context, ai_intent, ai_sentiment, ai_priority_score,
            sent_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          comm.channel_type, comm.sender_type, comm.sender_name,
          comm.recipient_type, comm.recipient_name, comm.content_text,
          comm.business_context, comm.ai_intent, comm.ai_sentiment,
          comm.ai_priority_score, new Date()
        ])
        results.sample_data_inserted++
      }

      // Sample business entities
      const sampleEntities = [
        {
          entity_type: 'client',
          name: 'Pooja Karthikeyan',
          primary_phone: '+919876543210',
          whatsapp_number: '+919876543210',
          email: 'pooja.k@example.com',
          acquisition_source: 'WhatsApp inquiry',
          ai_personality_profile: JSON.stringify({ communication_style: 'direct', preferred_time: 'evening' })
        },
        {
          entity_type: 'employee',
          name: 'Vikas Photography Team',
          primary_phone: '+919677362524',
          email: 'team@ooakphotography.com',
          designation: 'Photography Team Lead',
          ai_personality_profile: JSON.stringify({ expertise: 'wedding_photography', response_time: 'fast' })
        }
      ]

      for (const entity of sampleEntities) {
        await client.query(`
          INSERT INTO business_entities (
            entity_type, name, primary_phone, whatsapp_number, email,
            acquisition_source, ai_personality_profile
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          entity.entity_type, entity.name, entity.primary_phone,
          entity.whatsapp_number, entity.email, entity.acquisition_source,
          entity.ai_personality_profile
        ])
        results.sample_data_inserted++
      }

      // Sample knowledge base entries
      const sampleKnowledge = [
        {
          content_type: 'pricing_info',
          source_type: 'internal_documentation',
          title: 'Wedding Photography Packages',
          content: 'Basic Package: ₹75,000 - 6 hours photography, 300 edited photos. Premium Package: ₹1,50,000 - 8 hours photography, 500 edited photos, video highlights.',
          business_area: 'sales',
          relevance_tags: ['pricing', 'wedding', 'packages'],
          importance_score: 0.9
        },
        {
          content_type: 'process_documentation',
          source_type: 'workflow',
          title: 'Lead Follow-up Process',
          content: 'Step 1: Respond within 2 hours. Step 2: Send portfolio samples. Step 3: Schedule consultation call. Step 4: Send customized quotation.',
          business_area: 'operations',
          relevance_tags: ['process', 'lead_management', 'sales'],
          importance_score: 0.85
        }
      ]

      for (const knowledge of sampleKnowledge) {
        await client.query(`
          INSERT INTO knowledge_base (
            content_type, source_type, title, content, business_area,
            relevance_tags, importance_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          knowledge.content_type, knowledge.source_type, knowledge.title,
          knowledge.content, knowledge.business_area, knowledge.relevance_tags,
          knowledge.importance_score
        ])
        results.sample_data_inserted++
      }

      // Sample AI context session
      await client.query(`
        INSERT INTO ai_context_sessions (
          session_name, user_id, active_contexts, current_intent,
          context_memory, conversation_summary
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'Business Intelligence Session',
        'admin_user',
        JSON.stringify(['client_inquiries', 'sales_pipeline']),
        'business_analysis',
        JSON.stringify({ focus_area: 'lead_conversion', priority: 'high' }),
        'AI session for analyzing business performance and client communication patterns'
      ])
      results.sample_data_inserted++

      // Sample data sync status entries
      const syncPlatforms = [
        { platform: 'whatsapp', account_id: 'ooak_whatsapp', sync_enabled: true, sync_frequency_minutes: 5 },
        { platform: 'instagram', account_id: 'ooak_instagram', sync_enabled: true, sync_frequency_minutes: 15 },
        { platform: 'email', account_id: 'ooak_gmail', sync_enabled: true, sync_frequency_minutes: 10 }
      ]

      for (const syncInfo of syncPlatforms) {
        await client.query(`
          INSERT INTO data_sync_status (
            platform, account_id, sync_enabled, sync_frequency_minutes,
            last_sync_at, next_sync_scheduled_at, total_items_synced
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          syncInfo.platform, syncInfo.account_id, syncInfo.sync_enabled,
          syncInfo.sync_frequency_minutes, new Date(),
          new Date(Date.now() + syncInfo.sync_frequency_minutes * 60 * 1000),
          Math.floor(Math.random() * 100) + 10
        ])
        results.sample_data_inserted++
      }

      // Commit transaction
      await client.query('COMMIT')

      console.log('✅ Universal Business Intelligence System setup completed!')

      // Test the system functionality
      const testResult = await testUniversalSystem(client)

      return NextResponse.json({
        success: true,
        message: 'Universal Business Intelligence System setup completed successfully',
        results: {
          ...results,
          test_result: testResult
        },
        system_info: {
          total_tables: 7,
          total_indexes: 14,
          data_integration_platforms: ['whatsapp', 'instagram', 'email'],
          ai_capabilities: ['intent_recognition', 'sentiment_analysis', 'context_management'],
          features: [
            'Multi-platform communication tracking',
            'AI-powered query processing',
            'Real-time data synchronization',
            'Knowledge base management',
            'Business entity relationship mapping',
            'Automated data processing queue'
          ]
        }
      })

    } catch (error: any) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Setup failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      results: results
    }, { status: 500 })
  }
}

async function testUniversalSystem(client: any) {
  try {
    console.log('🧪 Testing Universal Business Intelligence System...')
    
    const tests = []
    
    // Test 1: Query communications
    const communicationsResult = await client.query(`
      SELECT 
        channel_type,
        sender_name,
        business_context,
        ai_intent,
        ai_sentiment,
        ai_priority_score
      FROM communications 
      ORDER BY created_at DESC 
      LIMIT 3
    `)
    tests.push({
      name: 'Communications Query',
      success: communicationsResult.rows.length > 0,
      data_points: communicationsResult.rows.length
    })

    // Test 2: Business entities analysis
    const entitiesResult = await client.query(`
      SELECT 
        entity_type,
        COUNT(*) as count,
        AVG(CASE WHEN entity_status = 'active' THEN 1 ELSE 0 END) as active_percentage
      FROM business_entities 
      GROUP BY entity_type
    `)
    tests.push({
      name: 'Business Entities Analysis',
      success: entitiesResult.rows.length > 0,
      entity_types: entitiesResult.rows.length
    })

    // Test 3: Knowledge base search simulation
    const knowledgeResult = await client.query(`
      SELECT 
        content_type,
        business_area,
        importance_score,
        array_length(relevance_tags, 1) as tag_count
      FROM knowledge_base 
      WHERE importance_score > 0.8
    `)
    tests.push({
      name: 'Knowledge Base Search',
      success: knowledgeResult.rows.length > 0,
      high_importance_items: knowledgeResult.rows.length
    })

    // Test 4: AI context sessions
    const aiSessionsResult = await client.query(`
      SELECT 
        session_status,
        current_intent,
        array_length(active_contexts::TEXT[], 1) as context_count
      FROM ai_context_sessions
      WHERE session_status = 'active'
    `)
    tests.push({
      name: 'AI Context Sessions',
      success: aiSessionsResult.rows.length > 0,
      active_sessions: aiSessionsResult.rows.length
    })

    // Test 5: Data sync monitoring
    const syncStatusResult = await client.query(`
      SELECT 
        platform,
        sync_enabled,
        total_items_synced,
        sync_frequency_minutes
      FROM data_sync_status
      WHERE sync_enabled = true
    `)
    tests.push({
      name: 'Data Sync Monitoring',
      success: syncStatusResult.rows.length > 0,
      active_platforms: syncStatusResult.rows.length
    })

    const successfulTests = tests.filter(t => t.success).length
    const totalTests = tests.length

    console.log(`✅ System tests completed: ${successfulTests}/${totalTests} passed`)

    return {
      tests_passed: successfulTests,
      total_tests: totalTests,
      success_rate: (successfulTests / totalTests * 100).toFixed(1) + '%',
      test_details: tests,
      system_status: successfulTests === totalTests ? 'fully_operational' : 'partially_operational'
    }

  } catch (error: any) {
    console.error('❌ System test failed:', error.message)
    return {
      tests_passed: 0,
      total_tests: 0,
      success_rate: '0%',
      error: error.message,
      system_status: 'failed'
    }
  }
}

export async function GET() {
  try {
    console.log('📊 Getting Business Intelligence System Status...')
    
    const client = await pool.connect()
    
    try {
      // Get system overview
      const systemOverview = await client.query(`
        SELECT 
          'communications' as table_name,
          COUNT(*) as record_count,
          MAX(created_at) as last_updated
        FROM communications
        UNION ALL
        SELECT 
          'business_entities',
          COUNT(*),
          MAX(created_at)
        FROM business_entities
        UNION ALL
        SELECT 
          'knowledge_base',
          COUNT(*),
          MAX(created_at)
        FROM knowledge_base
        UNION ALL
        SELECT 
          'ai_context_sessions',
          COUNT(*),
          MAX(created_at)
        FROM ai_context_sessions
        UNION ALL
        SELECT 
          'data_sync_status',
          COUNT(*),
          MAX(created_at)
        FROM data_sync_status
        ORDER BY table_name
      `)

      // Get platform sync status
      const syncStatus = await client.query(`
        SELECT 
          platform,
          sync_enabled,
          total_items_synced,
          last_sync_at,
          sync_frequency_minutes
        FROM data_sync_status
        ORDER BY platform
      `)

      // Get AI insights
      const aiInsights = await client.query(`
        SELECT 
          ai_intent,
          ai_sentiment,
          COUNT(*) as frequency,
          AVG(ai_priority_score) as avg_priority
        FROM communications
        WHERE ai_processed = true
        GROUP BY ai_intent, ai_sentiment
        ORDER BY frequency DESC
        LIMIT 10
      `)

      return NextResponse.json({
        success: true,
        system_overview: systemOverview.rows,
        sync_status: syncStatus.rows,
        ai_insights: aiInsights.rows,
        timestamp: new Date().toISOString(),
        status: 'operational'
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Failed to get system status:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 