import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client-unified'

export async function POST(request: NextRequest) {
  console.log('🔧 Setting up Universal Business Intelligence Tables')
  
  try {
    const { query, transaction } = createClient()
    
    // Create the core communications table
    const communicationsSQL = `
      CREATE TABLE IF NOT EXISTS communications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('whatsapp', 'instagram', 'email', 'call', 'sms', 'internal')),
        message_id VARCHAR(255),
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
        ai_processed BOOLEAN DEFAULT false,
        ai_intent VARCHAR(100),
        ai_sentiment VARCHAR(20),
        ai_priority_score DECIMAL(3,2) DEFAULT 0.5,
        sent_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: commError } = await query(`SELECT * FROM ${functionName}(${params})`)
    if (commError) {
      console.log('Creating communications table directly...')
      // Try direct creation if exec_sql doesn't exist
      const { error: directError } = await supabase
        .from('communications')
        .select('id')
        .limit(1)
      
      if (directError && directError.code === '42P01') {
        // Table doesn't exist, create it using raw SQL
        console.log('Communications table needs to be created')
      }
    }
    
    // Create business entities table
    const entitiesSQL = `
      CREATE TABLE IF NOT EXISTS business_entities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('client', 'employee', 'vendor', 'partner')),
        entity_status VARCHAR(20) DEFAULT 'active' CHECK (entity_status IN ('active', 'inactive', 'blocked')),
        name VARCHAR(255) NOT NULL,
        primary_phone VARCHAR(50),
        email VARCHAR(255),
        instagram_handle VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: entError } = await query(`SELECT * FROM ${functionName}(${params})`)
    
    // Create knowledge base table
    const knowledgeSQL = `
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_type VARCHAR(50) NOT NULL,
        source_type VARCHAR(50) NOT NULL,
        title VARCHAR(500),
        content TEXT NOT NULL,
        summary TEXT,
        business_area VARCHAR(100),
        importance_score DECIMAL(3,2) DEFAULT 0.5,
        visibility VARCHAR(20) DEFAULT 'internal' CHECK (visibility IN ('public', 'internal', 'confidential')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: knowError } = await query(`SELECT * FROM ${functionName}(${params})`)
    
    // Create AI context sessions table
    const sessionsSQL = `
      CREATE TABLE IF NOT EXISTS ai_context_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_name VARCHAR(255),
        user_id VARCHAR(255) NOT NULL,
        session_status VARCHAR(20) DEFAULT 'active' CHECK (session_status IN ('active', 'paused', 'ended')),
        started_at TIMESTAMPTZ DEFAULT NOW(),
        last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: sessError } = await query(`SELECT * FROM ${functionName}(${params})`)
    
    // Test table creation by inserting sample data
    console.log('📝 Testing table creation with sample data...')
    
    // Insert sample communication
    const sampleComm = {
      channel_type: 'email',
      message_id: 'setup_test_001',
      sender_type: 'client',
      sender_id: 'test@example.com',
      sender_name: 'Test User',
      recipient_type: 'employee',
      recipient_id: 'business@example.com',
      recipient_name: 'Business',
      content_text: 'This is a test communication for Universal BI setup',
      business_context: 'system_test',
      sent_at: new Date().toISOString()
    }
    
    const { data: commData, error: insertCommError } = await supabase
      .from('communications')
      .insert([sampleComm])
      .select()
    
    // Insert sample entity
    const sampleEntity = {
      entity_type: 'client',
      name: 'Test Client',
      email: 'test@example.com',
      primary_phone: '+1234567890'
    }
    
    const { data: entityData, error: insertEntityError } = await supabase
      .from('business_entities')
      .insert([sampleEntity])
      .select()
    
    // Insert sample knowledge
    const sampleKnowledge = {
      content_type: 'system_info',
      source_type: 'setup',
      title: 'Universal BI System Setup',
      content: 'Universal Business Intelligence system has been set up successfully',
      summary: 'System setup confirmation',
      business_area: 'system'
    }
    
    const { data: knowledgeData, error: insertKnowledgeError } = await supabase
      .from('knowledge_base')
      .insert([sampleKnowledge])
      .select()
    
    // Check final counts
    const { count: commCount } = await supabase
      .from('communications')
      .select('*', { count: 'exact', head: true })
    
    const { count: entityCount } = await supabase
      .from('business_entities')
      .select('*', { count: 'exact', head: true })
    
    const { count: knowledgeCount } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
    
    console.log('✅ Universal BI Tables Setup Complete')
    console.log(`📊 Communications: ${commCount}, Entities: ${entityCount}, Knowledge: ${knowledgeCount}`)
    
    return NextResponse.json({
      success: true,
      message: '🌟 Universal Business Intelligence Tables Created Successfully!',
      tables_created: {
        communications: !insertCommError,
        business_entities: !insertEntityError,
        knowledge_base: !insertKnowledgeError,
        ai_context_sessions: !sessError
      },
      sample_data: {
        communications_count: commCount || 0,
        entities_count: entityCount || 0,
        knowledge_count: knowledgeCount || 0
      },
      errors: {
        communications: insertCommError?.message,
        entities: insertEntityError?.message,
        knowledge: insertKnowledgeError?.message,
        sessions: sessError?.message
      }
    })
    
  } catch (error) {
    console.error('❌ Error setting up Universal BI tables:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to set up Universal BI tables',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Universal Business Intelligence Tables Setup',
    description: 'Creates the core tables for the Universal BI system',
    tables: [
      'communications - All business communications across channels',
      'business_entities - Unified client/employee/vendor database',
      'knowledge_base - Searchable business knowledge',
      'ai_context_sessions - AI conversation memory'
    ],
    usage: 'POST to this endpoint to create the tables'
  })
} 