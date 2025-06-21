-- WhatsApp Intelligence and AI Follow-up System
-- =============================================
-- This migration creates the foundation for AI-powered client communication analysis

-- WhatsApp Messages Storage
CREATE TABLE whatsapp_messages (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id),
  client_phone VARCHAR(20) NOT NULL,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('incoming', 'outgoing')),
  timestamp TIMESTAMP NOT NULL,
  interakt_message_id VARCHAR(100) UNIQUE,
  media_url TEXT, -- For images, documents, etc.
  media_type VARCHAR(50), -- 'image', 'document', 'audio', etc.
  ai_analyzed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Analysis Results for Messages
CREATE TABLE message_analysis (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral', 'urgent')),
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  intent VARCHAR(50), -- 'inquiry', 'objection', 'approval', 'revision_request', 'price_negotiation'
  urgency_level INTEGER CHECK (urgency_level >= 1 AND urgency_level <= 5),
  key_topics TEXT[], -- Array of extracted topics
  recommended_action TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ai_model_version VARCHAR(20) DEFAULT 'gpt-4',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation Sessions (Groups related messages)
CREATE TABLE conversation_sessions (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id),
  client_phone VARCHAR(20) NOT NULL,
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  overall_sentiment VARCHAR(20),
  business_outcome VARCHAR(30), -- 'ongoing', 'closed_won', 'closed_lost', 'revision_requested'
  ai_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI-Generated Tasks from Communication Analysis
CREATE TABLE ai_communication_tasks (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id),
  conversation_session_id INTEGER REFERENCES conversation_sessions(id),
  task_type VARCHAR(50) NOT NULL, -- 'follow_up', 'urgent_call', 'quotation_revision', 'send_info'
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to_employee_id INTEGER REFERENCES employees(id),
  due_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  ai_reasoning TEXT, -- Why AI recommended this task
  trigger_message_id INTEGER REFERENCES whatsapp_messages(id),
  created_by_ai BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Client Communication Timeline (Unified view of all interactions)
CREATE TABLE client_communication_timeline (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id),
  client_phone VARCHAR(20),
  communication_type VARCHAR(20) NOT NULL, -- 'whatsapp', 'call', 'email', 'meeting'
  communication_direction VARCHAR(10) NOT NULL CHECK (communication_direction IN ('inbound', 'outbound')),
  content TEXT,
  timestamp TIMESTAMP NOT NULL,
  employee_id INTEGER REFERENCES employees(id),
  reference_id INTEGER, -- ID from the source table (whatsapp_messages.id, call_logs.id, etc.)
  metadata JSONB, -- Additional data specific to communication type
  created_at TIMESTAMP DEFAULT NOW()
);

-- Business Lifecycle Tracking
CREATE TABLE quotation_business_lifecycle (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id) UNIQUE,
  current_stage VARCHAR(30) NOT NULL DEFAULT 'quotation_sent',
  -- Stages: quotation_sent, follow_up_active, negotiation, revision_requested, closing, closed_won, closed_lost
  stage_history JSONB[], -- Array of stage changes with timestamps
  probability_score INTEGER CHECK (probability_score >= 0 AND probability_score <= 100),
  last_client_interaction TIMESTAMP,
  next_follow_up_due TIMESTAMP,
  days_in_pipeline INTEGER DEFAULT 0,
  revision_count INTEGER DEFAULT 0,
  ai_insights TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_whatsapp_messages_quotation_timestamp ON whatsapp_messages(quotation_id, timestamp DESC);
CREATE INDEX idx_whatsapp_messages_phone_timestamp ON whatsapp_messages(client_phone, timestamp DESC);
CREATE INDEX idx_whatsapp_messages_ai_analyzed ON whatsapp_messages(ai_analyzed) WHERE ai_analyzed = FALSE;
CREATE INDEX idx_message_analysis_sentiment ON message_analysis(sentiment, urgency_level);
CREATE INDEX idx_ai_tasks_status_due ON ai_communication_tasks(status, due_date) WHERE status != 'completed';
CREATE INDEX idx_communication_timeline_quotation ON client_communication_timeline(quotation_id, timestamp DESC);
CREATE INDEX idx_business_lifecycle_stage ON quotation_business_lifecycle(current_stage, next_follow_up_due);

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_conversation_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Update message count and session end time
  UPDATE conversation_sessions 
  SET 
    message_count = message_count + 1,
    session_end = NEW.timestamp,
    updated_at = NOW()
  WHERE quotation_id = NEW.quotation_id 
    AND client_phone = NEW.client_phone
    AND session_end IS NULL;
    
  -- Create new session if none exists
  IF NOT FOUND THEN
    INSERT INTO conversation_sessions (quotation_id, client_phone, session_start, message_count)
    VALUES (NEW.quotation_id, NEW.client_phone, NEW.timestamp, 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_session
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_session();

-- Function to add entries to communication timeline
CREATE OR REPLACE FUNCTION add_to_communication_timeline()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_communication_timeline (
    quotation_id,
    client_phone,
    communication_type,
    communication_direction,
    content,
    timestamp,
    reference_id,
    metadata
  ) VALUES (
    NEW.quotation_id,
    NEW.client_phone,
    'whatsapp',
    CASE WHEN NEW.message_type = 'incoming' THEN 'inbound' ELSE 'outbound' END,
    NEW.message_text,
    NEW.timestamp,
    NEW.id,
    jsonb_build_object('interakt_message_id', NEW.interakt_message_id, 'media_type', NEW.media_type)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_to_communication_timeline
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION add_to_communication_timeline();

-- Sample data for testing (remove in production)
INSERT INTO conversation_sessions (quotation_id, client_phone, session_start, session_end, overall_sentiment, ai_summary) VALUES
(1, '+919677362524', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 'positive', 'Client showed interest in the photography package and asked about additional services.');

INSERT INTO quotation_business_lifecycle (quotation_id, current_stage, probability_score, last_client_interaction, next_follow_up_due) VALUES
(1, 'follow_up_active', 75, NOW() - INTERVAL '6 hours', NOW() + INTERVAL '2 days');

COMMIT; 