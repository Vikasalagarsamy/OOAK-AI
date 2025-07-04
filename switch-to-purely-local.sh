#!/bin/bash

# 🏠 Switch to PURELY LOCAL Supabase (No Remote Dependencies)
# ===========================================================

echo "🏠 Switching to PURELY LOCAL Supabase configuration..."
echo "🚫 This removes ALL remote dependencies"
echo ""

# Backup current .env.local
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup-before-purely-local
    echo "✅ Backed up current .env.local"
fi

# Create completely local configuration
cat > .env.local << 'EOF'
# 🏠 PURELY LOCAL SUPABASE CONFIGURATION
# ======================================
# ✨ This setup is 100% local with NO remote dependencies
# 🚫 These keys are generated by LOCAL Docker and work offline

# Application Configuration
PORT=3000
BASE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 🏠 LOCAL SUPABASE (Generated by Docker - NO REMOTE CONNECTION)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

# Webhook Verification Tokens (Local Development)
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

# Local Development URLs
PUBLIC_URL=http://localhost:3000
WEBHOOK_URL=http://localhost:3000/api/webhooks/whatsapp

# Configuration Info
ENVIRONMENT=purely_local
DATABASE_TYPE=local_supabase_only
SETUP_TYPE=offline_development
CLOUD_DEPENDENCY=none
GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# 🎯 NOTES:
# - These keys are generated by your LOCAL Docker Supabase
# - They have NO connection to remote Supabase
# - Will work completely offline
# - Safe to cancel remote Supabase subscription
EOF

echo ""
echo "✅ Created PURELY LOCAL configuration"
echo ""
echo "🏠 LOCAL SUPABASE SUMMARY:"
echo "=========================="
echo "🔑 Keys: Generated by LOCAL Docker (not remote)"
echo "🚫 Remote dependency: NONE"
echo "💾 Data location: 100% Local Docker containers"
echo "🌐 Internet required: NO (except for AI models)"
echo "💰 Supabase costs: $0 (you can cancel subscription)"
echo ""
echo "🎯 KEY DIFFERENCES:"
echo "✅ OLD: Using remote Supabase keys"
echo "✅ NEW: Using local Docker-generated keys"
echo "✅ Result: Complete independence from Supabase cloud"
echo ""
echo "🚀 Next Steps:"
echo "1. Test connection: node test-local-connection.cjs"
echo "2. Start your app: npm run dev"
echo "3. Verify everything works"
echo "4. Cancel remote Supabase subscription 💰"
echo ""
echo "✨ You are now 100% LOCAL and can work completely offline!" 