#!/usr/bin/env node

/**
 * AUTOMATIC ENVIRONMENT GENERATOR
 * ===============================
 * 
 * This script generates .env.local from the master configuration
 * Prevents manual errors and ensures consistency
 */

import { SYSTEM_CONFIG } from '../config/master-config.js'
import fs from 'fs'
import path from 'path'

const generateEnvFile = () => {
  console.log('🔧 Generating .env.local from master configuration...')
  
  const envContent = `# Universal Business AI - Auto-Generated Environment
# =================================================
# 🚨 DO NOT EDIT MANUALLY - Generated from config/master-config.js
# To make changes, edit config/master-config.js and run: npm run generate-env

# Application Configuration
PORT=${SYSTEM_CONFIG.APP.PORT}
BASE_URL=${SYSTEM_CONFIG.APP.BASE_URL}
NEXT_PUBLIC_BASE_URL=${SYSTEM_CONFIG.APP.BASE_URL}

# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL=${SYSTEM_CONFIG.DATABASE.URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SYSTEM_CONFIG.DATABASE.ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SYSTEM_CONFIG.DATABASE.SERVICE_ROLE_KEY}

# Webhook Verification Tokens
WHATSAPP_VERIFY_TOKEN=${SYSTEM_CONFIG.WEBHOOKS.WHATSAPP.VERIFY_TOKEN}
INSTAGRAM_VERIFY_TOKEN=${SYSTEM_CONFIG.WEBHOOKS.INSTAGRAM.VERIFY_TOKEN}
EMAIL_VERIFY_TOKEN=${SYSTEM_CONFIG.WEBHOOKS.EMAIL.VERIFY_TOKEN}
CALLS_VERIFY_TOKEN=${SYSTEM_CONFIG.WEBHOOKS.CALLS.VERIFY_TOKEN}

# AI Configuration
NEXT_PUBLIC_AI_ENABLED=${SYSTEM_CONFIG.AI.ENABLED}
AI_ACTIVE_MODEL=${SYSTEM_CONFIG.AI.ACTIVE_MODEL}
AI_FALLBACK_MODEL=${SYSTEM_CONFIG.AI.FALLBACK_MODEL}
CONFIDENCE_THRESHOLD=${SYSTEM_CONFIG.AI.CONFIDENCE_THRESHOLD}
MAX_RESPONSE_TIME_MS=${SYSTEM_CONFIG.AI.MAX_RESPONSE_TIME_MS}

# Local AI Models (Development)
LLM_ENDPOINT=http://127.0.0.1:11434
LLM_MODEL=llama3.1:8b
LLM_BACKUP_MODEL=qwen2.5:7b
LLM_PROVIDER=ollama
LLM_TIMEOUT=60000
LLM_MAX_RETRIES=3

# Remote GPU Servers (Production)
# RUNPOD_API_KEY=your_runpod_api_key
# RUNPOD_POD_ID=your_pod_id
# CUSTOM_GPU_API_KEY=your_custom_gpu_api_key

# External AI APIs (Fallback)
# OPENAI_API_KEY=your_openai_api_key
# ANTHROPIC_API_KEY=your_anthropic_api_key

# Security Configuration
API_SECRET_KEY=${SYSTEM_CONFIG.SECURITY.API_SECRET_KEY}
WEBHOOK_SECRET=${SYSTEM_CONFIG.SECURITY.WEBHOOK_SECRET}
JWT_SECRET=${SYSTEM_CONFIG.SECURITY.JWT_SECRET}

# Feature Flags
FEATURE_UNIVERSAL_AI=${SYSTEM_CONFIG.FEATURES.UNIVERSAL_AI}
FEATURE_REAL_TIME_SYNC=${SYSTEM_CONFIG.FEATURES.REAL_TIME_SYNC}
FEATURE_SENTIMENT_ANALYSIS=${SYSTEM_CONFIG.FEATURES.SENTIMENT_ANALYSIS}
FEATURE_LEAD_SCORING=${SYSTEM_CONFIG.FEATURES.LEAD_SCORING}

# Monitoring & Analytics
ANALYTICS_ENABLED=${SYSTEM_CONFIG.MONITORING.ANALYTICS_ENABLED}
LOGGING_LEVEL=${SYSTEM_CONFIG.MONITORING.LOGGING_LEVEL}
PERFORMANCE_MONITORING=${SYSTEM_CONFIG.MONITORING.PERFORMANCE_TRACKING}

# External API Configuration (To be configured in master-config.js)
WHATSAPP_BUSINESS_PHONE_NUMBER_ID=${SYSTEM_CONFIG.EXTERNAL_APIS.WHATSAPP.BUSINESS_PHONE_NUMBER_ID}
WHATSAPP_ACCESS_TOKEN=${SYSTEM_CONFIG.EXTERNAL_APIS.WHATSAPP.ACCESS_TOKEN}
INSTAGRAM_BUSINESS_ACCOUNT_ID=${SYSTEM_CONFIG.EXTERNAL_APIS.INSTAGRAM.BUSINESS_ACCOUNT_ID}
FACEBOOK_PAGE_ACCESS_TOKEN=${SYSTEM_CONFIG.EXTERNAL_APIS.INSTAGRAM.PAGE_ACCESS_TOKEN}
TWILIO_ACCOUNT_SID=${SYSTEM_CONFIG.EXTERNAL_APIS.TWILIO.ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${SYSTEM_CONFIG.EXTERNAL_APIS.TWILIO.AUTH_TOKEN}
TWILIO_PHONE_NUMBER=${SYSTEM_CONFIG.EXTERNAL_APIS.TWILIO.PHONE_NUMBER}
GMAIL_CLIENT_ID=${SYSTEM_CONFIG.EXTERNAL_APIS.GMAIL.CLIENT_ID}
GMAIL_CLIENT_SECRET=${SYSTEM_CONFIG.EXTERNAL_APIS.GMAIL.CLIENT_SECRET}
OUTLOOK_CLIENT_ID=${SYSTEM_CONFIG.EXTERNAL_APIS.OUTLOOK.CLIENT_ID}
OUTLOOK_CLIENT_SECRET=${SYSTEM_CONFIG.EXTERNAL_APIS.OUTLOOK.CLIENT_SECRET}

# Public URL (PERMANENT - ooak.photography domain)
PUBLIC_URL=https://api.ooak.photography

# Generation Info
GENERATED_AT=${new Date().toISOString()}
GENERATED_FROM=config/master-config.js
`

  // Write to .env.local
  const envPath = path.join(process.cwd(), '.env.local')
  fs.writeFileSync(envPath, envContent)
  
  console.log('✅ .env.local generated successfully!')
  console.log('📍 Location:', envPath)
  console.log('🔗 Source: config/master-config.js')
  console.log('')
  console.log('🎯 Key Configuration:')
  console.log(`   📊 Database: ${SYSTEM_CONFIG.DATABASE.URL}`)
  console.log(`   🚀 Port: ${SYSTEM_CONFIG.APP.PORT}`)
  console.log(`   🤖 AI Model: ${SYSTEM_CONFIG.AI.OPENAI_MODEL}`)
  console.log('')
  console.log('💡 To update configuration:')
  console.log('   1. Edit config/master-config.js')
  console.log('   2. Run: npm run generate-env')
  console.log('   3. Restart system: ./start-universal-ai.sh')
}

// Validate configuration before generating
const validation = SYSTEM_CONFIG.validateConfig?.() || { isValid: true, errors: [] }

if (!validation.isValid) {
  console.error('❌ Configuration validation failed:')
  validation.errors.forEach(error => console.error(`   - ${error}`))
  process.exit(1)
}

generateEnvFile() 