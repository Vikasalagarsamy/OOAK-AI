#!/bin/bash

# 🎯 Switch Next.js to Local Supabase Configuration
# =================================================

echo "🔄 Switching to Local Supabase Configuration..."
echo ""

# Backup current .env.local
if [ -f ".env.local" ]; then
    cp .env.local .env.local.remote-backup
    echo "✅ Backed up current .env.local to .env.local.remote-backup"
fi

# Create new .env.local with local Supabase settings
cat > .env.local << 'EOF'
# Universal Business AI - LOCAL SUPABASE CONFIGURATION
# ====================================================
# 🏠 This configuration uses your LOCAL Supabase instance

INTERAKT_API_KEY=QjFvT1hFa0luakQzNTk2ZkNGdjl1cWlxSko0cy1RUXJQSk1PQ2hyWi1Bczo=

# Application Configuration
PORT=3000
BASE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 🏠 LOCAL SUPABASE Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

# Webhook Verification Tokens
WHATSAPP_VERIFY_TOKEN=whatsapp_verify_123
INSTAGRAM_VERIFY_TOKEN=instagram_verify_456
EMAIL_VERIFY_TOKEN=email_verify_789
CALLS_VERIFY_TOKEN=calls_verify_321

# AI Configuration
NEXT_PUBLIC_AI_ENABLED=true
AI_ACTIVE_MODEL=local_ollama
AI_FALLBACK_MODEL=openai_gpt4
CONFIDENCE_THRESHOLD=0.8
MAX_RESPONSE_TIME_MS=5000

# Local AI Models (Development)
LLM_ENDPOINT=http://127.0.0.1:11434
LLM_MODEL=llama3.1:8b
LLM_BACKUP_MODEL=qwen2.5:7b
LLM_PROVIDER=ollama
LLM_TIMEOUT=60000
LLM_MAX_RETRIES=3

# Security Configuration
API_SECRET_KEY=universal_ai_secret_2024
WEBHOOK_SECRET=webhook_secret_2024
JWT_SECRET=jwt_secret_2024

# Feature Flags
FEATURE_UNIVERSAL_AI=true
FEATURE_REAL_TIME_SYNC=true
FEATURE_SENTIMENT_ANALYSIS=true
FEATURE_LEAD_SCORING=true

# Monitoring & Analytics
ANALYTICS_ENABLED=true
LOGGING_LEVEL=info
PERFORMANCE_MONITORING=true

# External API Configuration
WHATSAPP_BUSINESS_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
FACEBOOK_PAGE_ACCESS_TOKEN=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=

# Local Development URLs
PUBLIC_URL=http://localhost:3000
WEBHOOK_URL=http://localhost:3000/api/webhooks/whatsapp

# Configuration Info
ENVIRONMENT=local_development
DATABASE_TYPE=local_supabase
GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
EOF

echo "✅ Created new .env.local with LOCAL Supabase configuration"
echo ""
echo "🎯 CONFIGURATION SUMMARY:"
echo "========================"
echo "🏠 Supabase URL: http://localhost:8000"
echo "🔑 Using local Supabase API keys"
echo "📊 All your migrated data is available"
echo ""
echo "🚀 Next Steps:"
echo "1. Restart your Next.js development server: npm run dev"
echo "2. Your app will now use LOCAL Supabase"
echo "3. Open Studio: http://localhost:8000 (login: supabase/this_password_is_insecure_and_should_be_updated)"
echo ""
echo "🔄 To switch back to remote: bash switch-to-remote-supabase.sh"
echo ""
echo "✨ Local Supabase configuration applied successfully!" 