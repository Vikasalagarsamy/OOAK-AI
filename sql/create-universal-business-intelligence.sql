-- 🌟 UNIVERSAL BUSINESS INTELLIGENCE SYSTEM
-- =============================================
-- Captures ALL business communications A to Z for truly autonomous AI

-- ============================
-- 1. CORE COMMUNICATION TABLES
-- ============================

-- Universal Communications Table (All channels in one place)
CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Communication Identity
    channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('whatsapp', 'instagram', 'email', 'call', 'sms', 'internal')),
    message_id VARCHAR(255), -- External platform message ID
    thread_id VARCHAR(255), -- For grouping related messages
    
    -- Participants
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'employee', 'vendor', 'system')),
    sender_id VARCHAR(255), -- Phone number, email, Instagram handle, etc.
    sender_name VARCHAR(255),
    
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('client', 'employee', 'vendor', 'system')),
    recipient_id VARCHAR(255),
    recipient_name VARCHAR(255),
    
    -- Content
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'audio', 'document', 'voice_note')),
    content_text TEXT, -- Main message content
    content_metadata JSONB DEFAULT '{}', -- File URLs, dimensions, etc.
    
    -- Context & Intelligence
    business_context VARCHAR(50), -- 'lead_followup', 'quotation_discussion', 'project_delivery', etc.
    related_lead_id INTEGER,
    related_quotation_id INTEGER,
    related_project_id INTEGER,
    
    -- AI Processing
    ai_processed BOOLEAN DEFAULT false,
    ai_intent VARCHAR(100), -- 'inquiry', 'complaint', 'approval', 'schedule_request', etc.
    ai_sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    ai_keywords TEXT[], -- Extracted keywords
    ai_entities JSONB DEFAULT '{}', -- Names, dates, amounts mentioned
    ai_priority_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    
    -- Timestamps
    sent_at TIMESTAMPTZ NOT NULL,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication Attachments
CREATE TABLE IF NOT EXISTS communication_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'document'
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER, -- in bytes
    file_url TEXT,
    file_path TEXT, -- local storage path
    
    -- Media metadata
    duration INTEGER, -- for audio/video in seconds
    dimensions JSONB, -- {"width": 1920, "height": 1080}
    
    -- AI Processing
    ai_processed BOOLEAN DEFAULT false,
    ai_transcription TEXT, -- For audio/video
    ai_description TEXT, -- For images
    ai_extracted_text TEXT, -- OCR for documents
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- 2. BUSINESS ENTITIES SYSTEM
-- ============================

-- Unified Business Entities (Clients, Employees, Vendors)
CREATE TABLE IF NOT EXISTS business_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity Identity
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('client', 'employee', 'vendor', 'partner')),
    entity_status VARCHAR(20) DEFAULT 'active' CHECK (entity_status IN ('active', 'inactive', 'blocked')),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    
    -- Contact Information
    primary_phone VARCHAR(50),
    whatsapp_number VARCHAR(50),
    instagram_handle VARCHAR(100),
    email VARCHAR(255),
    
    -- Additional Contacts
    alternate_contacts JSONB DEFAULT '[]', -- Array of contact objects
    
    -- Business Information
    company_name VARCHAR(255),
    designation VARCHAR(100),
    address JSONB, -- Full address object
    
    -- Relationship Data
    relationship_manager_id UUID, -- Which employee manages this entity
    acquisition_source VARCHAR(100), -- How we got this contact
    
    -- AI Profile
    communication_preferences JSONB DEFAULT '{}', -- Preferred channels, times, etc.
    interaction_history_summary TEXT,
    ai_personality_profile JSONB DEFAULT '{}', -- Communication style, preferences
    
    -- Metadata
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entity Relationships (Who knows whom, referrals, etc.)
CREATE TABLE IF NOT EXISTS entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    entity_a_id UUID NOT NULL REFERENCES business_entities(id) ON DELETE CASCADE,
    entity_b_id UUID NOT NULL REFERENCES business_entities(id) ON DELETE CASCADE,
    
    relationship_type VARCHAR(50) NOT NULL, -- 'referred_by', 'works_with', 'family', 'friend', etc.
    relationship_strength DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    
    notes TEXT,
    established_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(entity_a_id, entity_b_id, relationship_type)
);

-- ============================
-- 3. CONVERSATION INTELLIGENCE
-- ============================

-- Conversation Threads (Group related communications)
CREATE TABLE IF NOT EXISTS conversation_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Thread Identity
    thread_name VARCHAR(255),
    thread_type VARCHAR(50) NOT NULL, -- 'lead_inquiry', 'project_delivery', 'support', etc.
    
    -- Participants
    participants JSONB NOT NULL, -- Array of participant objects
    primary_client_id UUID,
    assigned_employee_id UUID,
    
    -- Business Context
    related_lead_id INTEGER,
    related_quotation_id INTEGER,
    related_project_id INTEGER,
    
    -- Thread Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- AI Summary
    ai_summary TEXT,
    ai_next_actions TEXT[],
    ai_key_decisions JSONB DEFAULT '[]',
    
    -- Timeline
    started_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link communications to threads
CREATE TABLE IF NOT EXISTS thread_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(thread_id, communication_id)
);

-- ============================
-- 4. KNOWLEDGE BASE SYSTEM
-- ============================

-- Universal Knowledge Base (Searchable content)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content Identity
    content_type VARCHAR(50) NOT NULL, -- 'communication', 'document', 'decision', 'policy', etc.
    source_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'email', 'meeting', 'internal', etc.
    source_id UUID, -- Reference to source record
    
    -- Content
    title VARCHAR(500),
    content TEXT NOT NULL,
    summary TEXT,
    
    -- Context
    business_area VARCHAR(100), -- 'sales', 'delivery', 'support', 'finance', etc.
    relevance_tags TEXT[] DEFAULT '{}',
    entity_mentions UUID[], -- Referenced business entities
    
    -- AI Processing
    content_embedding VECTOR(1536), -- For semantic search (OpenAI embeddings)
    ai_keywords TEXT[],
    ai_categories TEXT[],
    importance_score DECIMAL(3,2) DEFAULT 0.5,
    
    -- Access Control
    visibility VARCHAR(20) DEFAULT 'internal' CHECK (visibility IN ('public', 'internal', 'confidential')),
    access_groups TEXT[] DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Base Relations (How knowledge items connect)
CREATE TABLE IF NOT EXISTS knowledge_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    parent_knowledge_id UUID NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
    child_knowledge_id UUID NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
    
    relation_type VARCHAR(50) NOT NULL, -- 'follows_up', 'references', 'contradicts', 'updates', etc.
    strength DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(parent_knowledge_id, child_knowledge_id, relation_type)
);

-- ============================
-- 5. AI CONTEXT MANAGEMENT
-- ============================

-- AI Context Sessions (Track AI conversation contexts)
CREATE TABLE IF NOT EXISTS ai_context_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Session Identity
    session_name VARCHAR(255),
    user_id UUID NOT NULL,
    
    -- Context Data
    active_contexts JSONB DEFAULT '[]', -- Array of active context objects
    context_history JSONB DEFAULT '[]', -- Previous contexts in this session
    
    -- AI State
    current_intent VARCHAR(100),
    context_memory JSONB DEFAULT '{}', -- Key information to remember
    conversation_summary TEXT,
    
    -- Session Management
    session_status VARCHAR(20) DEFAULT 'active' CHECK (session_status IN ('active', 'paused', 'ended')),
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Query History (Track what AI was asked and how it responded)
CREATE TABLE IF NOT EXISTS ai_query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    session_id UUID REFERENCES ai_context_sessions(id) ON DELETE CASCADE,
    
    -- Query
    user_query TEXT NOT NULL,
    query_intent VARCHAR(100),
    query_entities JSONB DEFAULT '{}',
    
    -- Context Retrieved
    context_sources JSONB DEFAULT '[]', -- What data was used to answer
    retrieved_communications INTEGER DEFAULT 0,
    retrieved_knowledge_items INTEGER DEFAULT 0,
    
    -- Response
    ai_response TEXT NOT NULL,
    response_confidence DECIMAL(3,2),
    response_sources TEXT[], -- References used
    
    -- Performance
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- 6. REAL-TIME SYNC TABLES
-- ============================

-- Data Sync Status (Track what's been synced from external sources)
CREATE TABLE IF NOT EXISTS data_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source
    platform VARCHAR(50) NOT NULL, -- 'whatsapp', 'instagram', 'gmail', etc.
    account_id VARCHAR(255), -- Platform account identifier
    
    -- Sync Status
    last_sync_at TIMESTAMPTZ,
    last_successful_sync_at TIMESTAMPTZ,
    next_sync_scheduled_at TIMESTAMPTZ,
    
    -- Sync Stats
    total_items_synced INTEGER DEFAULT 0,
    items_synced_today INTEGER DEFAULT 0,
    last_sync_error TEXT,
    
    -- Configuration
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency_minutes INTEGER DEFAULT 15,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(platform, account_id)
);

-- Data Processing Queue (For background processing)
CREATE TABLE IF NOT EXISTS data_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Task Identity
    task_type VARCHAR(50) NOT NULL, -- 'ai_process_communication', 'generate_embeddings', etc.
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    
    -- Task Data
    source_table VARCHAR(50),
    source_id UUID,
    task_data JSONB NOT NULL,
    
    -- Processing Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Results
    result_data JSONB,
    error_message TEXT,
    
    -- Timing
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- INDEXES FOR PERFORMANCE
-- ============================

-- Communications indexes
CREATE INDEX IF NOT EXISTS idx_communications_channel_type ON communications(channel_type);
CREATE INDEX IF NOT EXISTS idx_communications_sender_id ON communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_communications_sent_at ON communications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_business_context ON communications(business_context);
CREATE INDEX IF NOT EXISTS idx_communications_ai_intent ON communications(ai_intent);
CREATE INDEX IF NOT EXISTS idx_communications_related_lead ON communications(related_lead_id);
CREATE INDEX IF NOT EXISTS idx_communications_related_quotation ON communications(related_quotation_id);

-- Business entities indexes
CREATE INDEX IF NOT EXISTS idx_business_entities_type ON business_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_business_entities_phone ON business_entities(primary_phone);
CREATE INDEX IF NOT EXISTS idx_business_entities_email ON business_entities(email);
CREATE INDEX IF NOT EXISTS idx_business_entities_whatsapp ON business_entities(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_business_entities_instagram ON business_entities(instagram_handle);

-- Knowledge base indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_type ON knowledge_base(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_business_area ON knowledge_base(business_area);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_importance ON knowledge_base(importance_score DESC);

-- Vector search index (for semantic search)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON knowledge_base USING ivfflat (content_embedding vector_cosine_ops);

-- AI context indexes
CREATE INDEX IF NOT EXISTS idx_ai_context_sessions_user ON ai_context_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_query_history_session ON ai_query_history(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_query_history_created ON ai_query_history(created_at DESC);

-- Processing queue indexes
CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON data_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_processing_queue_priority ON data_processing_queue(priority, scheduled_at);

-- ============================
-- SAMPLE DATA
-- ============================

-- Insert sample business entities (employees from existing system)
INSERT INTO business_entities (entity_type, name, email, entity_status)
SELECT 'employee', name, email, 'active'
FROM employees 
WHERE name IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create a knowledge base entry for system capabilities
INSERT INTO knowledge_base (content_type, source_type, title, content, business_area, relevance_tags, importance_score)
VALUES (
    'system_capability',
    'internal',
    'Business Intelligence System Capabilities',
    'The Universal Business Intelligence System captures all business communications including WhatsApp chats, Instagram messages, emails, and call transcripts. It provides AI-powered insights, context management, and autonomous decision support.',
    'system',
    ARRAY['ai', 'intelligence', 'communication', 'automation'],
    1.0
); 