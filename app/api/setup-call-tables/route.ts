import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    console.log('🏗️ Setting up call analytics tables...')
    
    // Let's create the tables using simple inserts to test first
    // Then provide SQL for manual execution if needed
    
    return NextResponse.json({
      success: true,
      message: 'Please create tables manually in Supabase dashboard',
      instructions: 'Go to Supabase Dashboard > SQL Editor and run the SQL commands provided',
      sql_commands: {
        call_transcriptions: `
CREATE TABLE IF NOT EXISTS call_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id VARCHAR(255) UNIQUE NOT NULL,
    task_id UUID,
    lead_id INTEGER,
    client_name VARCHAR(255) NOT NULL,
    sales_agent VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    duration INTEGER NOT NULL,
    recording_url TEXT,
    transcript TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.8,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);`,
        call_analytics: `
CREATE TABLE IF NOT EXISTS call_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id VARCHAR(255) NOT NULL,
    overall_sentiment VARCHAR(20),
    sentiment_score DECIMAL(3,2) DEFAULT 0,
    client_sentiment VARCHAR(20),
    agent_sentiment VARCHAR(20),
    call_intent VARCHAR(255),
    key_topics JSONB DEFAULT '[]'::jsonb,
    business_outcomes JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    agent_professionalism_score INTEGER,
    agent_responsiveness_score INTEGER,
    agent_knowledge_score INTEGER,
    agent_closing_effectiveness INTEGER,
    client_engagement_level VARCHAR(20),
    client_interest_level VARCHAR(20),
    client_objection_handling JSONB DEFAULT '[]'::jsonb,
    client_buying_signals JSONB DEFAULT '[]'::jsonb,
    forbidden_words_detected JSONB DEFAULT '[]'::jsonb,
    compliance_issues JSONB DEFAULT '[]'::jsonb,
    risk_level VARCHAR(20),
    talk_time_ratio DECIMAL(4,2) DEFAULT 1.0,
    interruptions INTEGER DEFAULT 0,
    silent_periods INTEGER DEFAULT 0,
    call_quality_score DECIMAL(3,1) DEFAULT 7.0,
    quote_discussed BOOLEAN DEFAULT false,
    budget_mentioned BOOLEAN DEFAULT false,
    timeline_discussed BOOLEAN DEFAULT false,
    next_steps_agreed BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);`,
        call_insights: `
CREATE TABLE IF NOT EXISTS call_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id VARCHAR(255) NOT NULL,
    conversion_indicators JSONB DEFAULT '[]'::jsonb,
    objection_patterns JSONB DEFAULT '[]'::jsonb,
    successful_techniques JSONB DEFAULT '[]'::jsonb,
    improvement_areas JSONB DEFAULT '[]'::jsonb,
    decision_factors JSONB DEFAULT '[]'::jsonb,
    pain_points JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '[]'::jsonb,
    concerns JSONB DEFAULT '[]'::jsonb,
    market_trends JSONB DEFAULT '[]'::jsonb,
    competitive_mentions JSONB DEFAULT '[]'::jsonb,
    pricing_feedback JSONB DEFAULT '[]'::jsonb,
    service_feedback JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);`
      },
      next_steps: [
        '1. Go to your Supabase project dashboard',
        '2. Click on "SQL Editor" in the sidebar',
        '3. Copy and paste each SQL command above',
        '4. Execute each command one by one',
        '5. Come back and test the manual transcript feature'
      ]
    })
    
  } catch (error) {
    console.error('❌ Table setup error:', error)
    return NextResponse.json(
      { 
        error: 'Table setup failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 