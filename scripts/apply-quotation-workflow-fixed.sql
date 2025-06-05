-- Drop existing table if it exists
DROP TABLE IF EXISTS post_sale_confirmations CASCADE;

-- Create enhanced post_sale_confirmations table
CREATE TABLE post_sale_confirmations (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  confirmed_by_user_id UUID NOT NULL,
  confirmation_date TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Call Details
  call_date DATE NOT NULL,
  call_time TIME NOT NULL,
  call_duration INTEGER NOT NULL DEFAULT 30, -- minutes
  client_contact_person VARCHAR(255) NOT NULL,
  confirmation_method VARCHAR(50) NOT NULL DEFAULT 'phone', -- phone, video_call, in_person, email
  
  -- Service and Deliverable Confirmations (JSON)
  services_confirmed JSONB DEFAULT '[]',
  deliverables_confirmed JSONB DEFAULT '[]',
  
  -- Event Details Confirmation (JSON)
  event_details_confirmed JSONB DEFAULT '{}',
  
  -- Client Feedback
  client_satisfaction_rating INTEGER DEFAULT 5 CHECK (client_satisfaction_rating BETWEEN 1 AND 5),
  client_expectations TEXT NOT NULL,
  client_concerns TEXT,
  additional_requests TEXT,
  
  -- Documentation
  call_summary TEXT NOT NULL,
  action_items TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  
  -- File Attachments (JSON)
  attachments JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_post_sale_confirmations_quotation_id ON post_sale_confirmations(quotation_id);
CREATE INDEX idx_post_sale_confirmations_confirmed_by ON post_sale_confirmations(confirmed_by_user_id);
CREATE INDEX idx_post_sale_confirmations_call_date ON post_sale_confirmations(call_date);
CREATE INDEX idx_post_sale_confirmations_follow_up ON post_sale_confirmations(follow_up_required, follow_up_date); 