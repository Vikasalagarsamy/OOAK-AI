-- AI Configuration Management System
-- This ensures AI behavior is persistent and doesn't get lost during restarts/deployments

-- Create AI configuration table for storing prompts and settings
CREATE TABLE IF NOT EXISTS ai_configurations (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_type VARCHAR(50) NOT NULL, -- 'system_prompt', 'business_context', 'personality', 'guidelines'
  config_value TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- Create AI prompt templates table
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL,
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- Variables that can be injected into template
  category VARCHAR(50) NOT NULL, -- 'business_advisor', 'client_handler', 'task_manager'
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI behavior settings table
CREATE TABLE IF NOT EXISTS ai_behavior_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'hallucination_prevention', 'response_style', 'data_validation'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert core AI configuration (anti-hallucination system)
INSERT INTO ai_configurations (config_key, config_type, config_value, created_by, description) VALUES
('hallucination_prevention', 'guidelines', 
'CRITICAL INSTRUCTION: NEVER make up or invent data. ONLY use information provided in this context. If you don''t have specific information, say "I don''t have those details" instead of creating fictional data.

ANTI-HALLUCINATION RULES:
- NEVER create fake dates, events, or historical information
- NEVER invent client conversations or interactions
- NEVER make up quotation details not in the database
- If asked about specific events/dates, only reference actual database records
- When unsure, explicitly state "I don''t have that information"
- Always cite data sources when making claims', 
'00000000-0000-0000-0000-000000000000',
'Core anti-hallucination guidelines that prevent AI from making up information'),

('business_personality', 'personality',
'You are Vikas''s personal AI business advisor for his creative photography business. You know everything about his operations and speak like a trusted business partner.

PERSONALITY GUIDELINES:
- You''re a smart business partner, not a chatbot
- Skip greetings unless it''s the first interaction  
- Give direct, actionable business advice
- Understand photography/creative business context
- Reference specific clients and numbers when relevant
- Suggest concrete next steps
- Be conversational but professional
- If asked about clients, quotations, or business - give specific details

Respond naturally as if you''re discussing business with a colleague who trusts your judgment.',
'00000000-0000-0000-0000-000000000000',
'Core business advisor personality and communication style'),

('data_validation_rules', 'business_context',
'DATA VALIDATION REQUIREMENTS:
- All financial figures must come from actual quotations table
- All client names must match database records exactly
- All event dates must come from quotation_events table
- All employee information must come from employees table
- Revenue calculations must be based on approved quotations only
- Lead conversion rates must be calculated from actual leads data

BUSINESS CONTEXT STRUCTURE:
The AI must always load real-time business data including:
- Current revenue from quotations.total_amount where status IN (''approved'', ''completed'')
- Active quotations from quotations where status = ''sent''
- Team information from employees table
- Client insights from actual client interactions
- Event details from quotation_events table',
'00000000-0000-0000-0000-000000000000',
'Data validation rules and business context requirements');

-- Insert default prompt templates
INSERT INTO ai_prompt_templates (template_name, template_content, variables, category, is_default) VALUES
('business_advisor_system_prompt', 
'BUSINESS INTELLIGENCE CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{HALLUCINATION_PREVENTION_RULES}}

{{BUSINESS_PERSONALITY}}

CURRENT BUSINESS STATUS:
💰 Revenue: ₹{{TOTAL_REVENUE}} ({{TOTAL_QUOTATIONS}} quotations, {{CONVERSION_RATE}}% conversion)
👥 Team: {{TEAM_COUNT}} people ({{TEAM_MEMBERS}})
📊 Active Clients: {{ACTIVE_CLIENTS}}

ACTIVE QUOTATIONS:
{{ACTIVE_QUOTATIONS_LIST}}

CLIENT INSIGHTS:
{{CLIENT_INSIGHTS}}

{{SPECIFIC_CLIENT_DATA}}

CURRENT MESSAGE: "{{USER_MESSAGE}}"

{{DATA_VALIDATION_RULES}}

Respond naturally as if you''re discussing business with a colleague who trusts your judgment.',
'{"HALLUCINATION_PREVENTION_RULES": "string", "BUSINESS_PERSONALITY": "string", "TOTAL_REVENUE": "number", "TOTAL_QUOTATIONS": "number", "CONVERSION_RATE": "number", "TEAM_COUNT": "number", "TEAM_MEMBERS": "string", "ACTIVE_CLIENTS": "number", "ACTIVE_QUOTATIONS_LIST": "string", "CLIENT_INSIGHTS": "string", "SPECIFIC_CLIENT_DATA": "string", "USER_MESSAGE": "string", "DATA_VALIDATION_RULES": "string"}',
'business_advisor',
true);

-- Insert AI behavior settings (anti-hallucination configuration)
INSERT INTO ai_behavior_settings (setting_key, setting_value, description, category) VALUES
('hallucination_prevention', 
'{"enabled": true, "strict_mode": true, "require_data_sources": true, "validate_dates": true, "validate_financial_data": true, "max_speculation_level": 0}',
'Prevents AI from making up information not present in provided context',
'hallucination_prevention'),

('response_validation', 
'{"check_for_fake_dates": true, "check_for_fake_events": true, "check_for_fake_clients": true, "require_database_citations": true}',
'Validates AI responses against known data to prevent hallucination',
'data_validation'),

('business_data_refresh', 
'{"auto_refresh_interval": 300, "cache_business_context": true, "validate_data_freshness": true}',
'Ensures business context is always fresh and accurate',
'data_validation');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_configurations_active ON ai_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_configurations_type ON ai_configurations(config_type);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_active ON ai_prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_default ON ai_prompt_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_ai_behavior_settings_active ON ai_behavior_settings(is_active);

-- Create function to get active AI configuration
CREATE OR REPLACE FUNCTION get_ai_system_configuration()
RETURNS JSON AS $$
DECLARE
  config_result JSON;
BEGIN
  SELECT json_object_agg(config_key, config_value) INTO config_result
  FROM ai_configurations 
  WHERE is_active = true;
  
  RETURN config_result;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate AI response against hallucination rules
CREATE OR REPLACE FUNCTION validate_ai_response(response_text TEXT)
RETURNS JSON AS $$
DECLARE
  validation_result JSON;
  hallucination_score INTEGER := 0;
  warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check for potential fake dates (dates before current business start)
  IF response_text ~* '\d{4}-\d{2}-\d{2}' AND response_text ~* '(2020|2021|2022|2023)' THEN
    hallucination_score := hallucination_score + 1;
    warnings := array_append(warnings, 'Potential fake historical dates detected');
  END IF;
  
  -- Check for made-up quotation references
  IF response_text ~* 'quotation.*sent.*\d{4}-\d{2}-\d{2}' THEN
    hallucination_score := hallucination_score + 1;
    warnings := array_append(warnings, 'Potential fake quotation timeline detected');
  END IF;
  
  -- Return validation result
  SELECT json_build_object(
    'is_valid', hallucination_score = 0,
    'hallucination_score', hallucination_score,
    'warnings', warnings,
    'validation_timestamp', NOW()
  ) INTO validation_result;
  
  RETURN validation_result;
END;
$$ LANGUAGE plpgsql; 

