#!/bin/bash

# 🌐 Switch Next.js to Remote Supabase Configuration
# ==================================================

echo "🌐 Switching to Remote Supabase Configuration..."
echo ""

# Check if backup exists
if [ -f ".env.local.remote-backup" ]; then
    cp .env.local.remote-backup .env.local
    echo "✅ Restored remote configuration from backup"
else
    echo "❌ No remote backup found. Creating fresh remote config..."
    
    # Create remote configuration
    cat > .env.local << 'EOF'
# Universal Business AI - REMOTE SUPABASE CONFIGURATION
# =====================================================
# 🌐 This configuration uses your REMOTE Supabase instance

INTERAKT_API_KEY=QjFvT1hFa0luakQzNTk2ZkNGdjl1cWlxSko0cy1RUXJQSk1PQ2hyWi1Bczo=

# Application Configuration
PORT=3000
BASE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 🌐 REMOTE SUPABASE Configuration
NEXT_PUBLIC_SUPABASE_URL=https://aavofqdzjhyfjygkxynq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTg5MTQsImV4cCI6MjA2MDY3NDkxNH0.wLxD0Tcp5YnpErGSYGF5mmO78V4zIlCvFSeBrPFy9kY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY

# Rest of configuration...
WHATSAPP_VERIFY_TOKEN=whatsapp_verify_123
INSTAGRAM_VERIFY_TOKEN=instagram_verify_456
EMAIL_VERIFY_TOKEN=email_verify_789
CALLS_VERIFY_TOKEN=calls_verify_321

NEXT_PUBLIC_AI_ENABLED=true
AI_ACTIVE_MODEL=local_ollama
AI_FALLBACK_MODEL=openai_gpt4
CONFIDENCE_THRESHOLD=0.8
MAX_RESPONSE_TIME_MS=5000

LLM_ENDPOINT=http://127.0.0.1:11434
LLM_MODEL=llama3.1:8b
LLM_BACKUP_MODEL=qwen2.5:7b
LLM_PROVIDER=ollama
LLM_TIMEOUT=60000
LLM_MAX_RETRIES=3

API_SECRET_KEY=universal_ai_secret_2024
WEBHOOK_SECRET=webhook_secret_2024
JWT_SECRET=jwt_secret_2024

FEATURE_UNIVERSAL_AI=true
FEATURE_REAL_TIME_SYNC=true
FEATURE_SENTIMENT_ANALYSIS=true
FEATURE_LEAD_SCORING=true

ANALYTICS_ENABLED=true
LOGGING_LEVEL=info
PERFORMANCE_MONITORING=true

PUBLIC_URL=https://api.ooak.photography
WEBHOOK_URL=https://api.ooak.photography/api/webhooks/whatsapp

ENVIRONMENT=production
DATABASE_TYPE=remote_supabase
GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
EOF

fi

echo ""
echo "🎯 CONFIGURATION SUMMARY:"
echo "========================"
echo "🌐 Supabase URL: https://aavofqdzjhyfjygkxynq.supabase.co"
echo "🔑 Using remote Supabase API keys"
echo "📊 Connected to production database"
echo ""
echo "🚀 Next Steps:"
echo "1. Restart your Next.js development server: npm run dev"
echo "2. Your app will now use REMOTE Supabase"
echo ""
echo "🔄 To switch back to local: bash switch-to-local-supabase.sh"
echo ""
echo "✨ Remote Supabase configuration applied successfully!" 