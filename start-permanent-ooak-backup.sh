#!/bin/bash

# Universal AI System - PERMANENT Startup Script with Call Analytics & Supabase
# ==============================================================================
# Uses NAMED Cloudflare Tunnel with ooak.photography domain
# URL NEVER CHANGES: https://api.ooak.photography
# Includes: Whisper Large V3, Ollama, Call Analytics, WhatsApp, Supabase Studio

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 STARTING UNIVERSAL AI SYSTEM - PERMANENT SETUP WITH CALL ANALYTICS & SUPABASE${NC}"
echo "=========================================================================================="
echo -e "${GREEN}✅ Domain: ooak.photography${NC}"
echo -e "${GREEN}✅ Permanent URL: https://api.ooak.photography${NC}"
echo -e "${GREEN}✅ WhatsApp Webhook: https://api.ooak.photography/api/webhooks/whatsapp${NC}"
echo -e "${GREEN}✅ Call Analytics: https://api.ooak.photography/api/webhooks/local-calls${NC}"
echo -e "${GREEN}✅ Whisper Large V3: Included${NC}"
echo -e "${GREEN}✅ Ollama LLM: Included${NC}"
echo -e "${GREEN}✅ Supabase Studio: http://localhost:54323${NC}"
echo ""

# Function to check if process is running
check_process() {
    pgrep -f "$1" > /dev/null
    return $?
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to check Docker status
check_docker() {
    echo -e "${CYAN}🐳 Checking Docker status...${NC}"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo -e "${YELLOW}💡 Please install Docker Desktop from https://www.docker.com/products/docker-desktop${NC}"
        return 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ Docker daemon is not running, starting Docker Desktop...${NC}"
        open -a Docker
        
        # Wait for Docker to start
        local attempt=1
        local max_attempts=60
        echo -e "${YELLOW}⏳ Waiting for Docker to start...${NC}"
        
        while [ $attempt -le $max_attempts ]; do
            if docker info > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Docker is now running!${NC}"
                break
            fi
            echo -n "."
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            echo -e "${RED}❌ Docker failed to start after $max_attempts attempts${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✅ Docker is running${NC}"
    fi
    
    return 0
}

# Function to start Supabase services
start_supabase() {
    echo -e "${CYAN}📊 Starting Supabase services...${NC}"
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}❌ Supabase CLI is not installed${NC}"
        echo -e "${YELLOW}💡 Please install Supabase CLI: brew install supabase/tap/supabase${NC}"
        return 1
    fi
    
    # Check if supabase project is initialized
    if [ ! -f "supabase/config.toml" ]; then
        echo -e "${RED}❌ Supabase project not initialized${NC}"
        echo -e "${YELLOW}💡 Please run: supabase init${NC}"
        return 1
    fi
    
    # Check if Supabase services are already running
    if supabase status 2>/dev/null | grep -q "supabase local development setup is running"; then
        echo -e "${GREEN}✅ Supabase services are already running${NC}"
        return 0
    fi
    
    # Prevent accidental database resets
    if [[ -f ".env" ]] && grep -q "PREVENT_DB_RESET=true" ".env"; then
        echo -e "${YELLOW}⚠️ Database reset prevention is enabled${NC}"
        # Override the dangerous command
        function supabase() {
            if [[ "$1" == "db" ]] && [[ "$2" == "reset" ]]; then
                echo -e "${RED}❌ Database reset operation is disabled for safety${NC}"
                return 1
            fi
            command supabase "$@"
        }
        export -f supabase
    fi
    
    # Start Supabase services using CLI
    echo -e "${YELLOW}🚀 Starting Supabase services...${NC}"
    supabase start
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Supabase services started successfully${NC}"
        
        # Display service status
        echo -e "${CYAN}📋 Supabase Service Status:${NC}"
        supabase status
        
    else
        echo -e "${RED}❌ Failed to start Supabase services${NC}"
        return 1
    fi
    
    return 0
}

# Function to test Supabase services
test_supabase_services() {
    echo -e "${CYAN}🧪 Testing Supabase services...${NC}"
    
    # Test Supabase Studio (correct port from our setup)
    if curl -s http://127.0.0.1:54323 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Supabase Studio: WORKING (http://127.0.0.1:54323)${NC}"
    else
        echo -e "${RED}❌ Supabase Studio: FAILED${NC}"
    fi
    
    # Test Supabase API (correct port from our setup)
    if curl -s http://127.0.0.1:54321/rest/v1/ >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Supabase API: WORKING (http://127.0.0.1:54321)${NC}"
    else
        echo -e "${RED}❌ Supabase API: FAILED${NC}"
    fi
    
    # Test PostgreSQL (correct port from our setup)
    if pg_isready -h 127.0.0.1 -p 54322 -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL Database: WORKING (port 54322)${NC}"
    else
        echo -e "${RED}❌ PostgreSQL Database: FAILED${NC}"
    fi
    
    # Test Auth service
    if curl -s http://127.0.0.1:54321/auth/v1/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Supabase Auth: WORKING${NC}"
    else
        echo -e "${RED}❌ Supabase Auth: FAILED${NC}"
    fi
    
    # Test if our synced data is available
    record_count=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM companies;" 2>/dev/null | xargs)
    if [ "$record_count" -gt 0 ] 2>/dev/null; then
        echo -e "${GREEN}✅ Synced Data: $record_count companies found${NC}"
    else
        echo -e "${YELLOW}⚠️ Synced Data: No companies found (may need to run data sync)${NC}"
    fi
}

# Function to check Python environment
check_python_env() {
    echo -e "${YELLOW}🐍 Checking Python environment for Whisper...${NC}"
    
    # Check if whisper-env exists
    if [ -d "whisper-env" ]; then
        echo -e "${GREEN}✅ Whisper Python environment found${NC}"
        
        # Activate and test
        source whisper-env/bin/activate
        
        # Check faster-whisper
        if python -c "import faster_whisper" 2>/dev/null; then
            echo -e "${GREEN}✅ faster-whisper is available${NC}"
        else
            echo -e "${RED}❌ faster-whisper not found, installing...${NC}"
            pip install faster-whisper
        fi
        
        # Test large-v3 model availability
        echo -e "${YELLOW}📦 Testing Whisper Large-V3 model...${NC}"
        python -c "
from faster_whisper import WhisperModel
print('Testing Large-V3 model...')
try:
    model = WhisperModel('large-v3', device='cpu', compute_type='int8')
    print('✅ Large-V3 model ready')
except Exception as e:
    print(f'⚠️ Large-V3 model will download on first use: {e}')
" 2>/dev/null || echo -e "${YELLOW}⚠️ Large-V3 model will download on first use${NC}"
        
        deactivate
    else
        echo -e "${YELLOW}⚠️ Creating Whisper Python environment...${NC}"
        python3 -m venv whisper-env
        source whisper-env/bin/activate
        pip install faster-whisper
        deactivate
        echo -e "${GREEN}✅ Whisper environment created${NC}"
    fi
}

# Function to start Ollama
start_ollama() {
    echo -e "${PURPLE}🤖 Starting Ollama LLM service...${NC}"
    
    # Check if Ollama is already running
    if check_process "ollama serve"; then
        echo -e "${GREEN}✅ Ollama is already running${NC}"
        return 0
    fi
    
    # Check if Ollama is installed
    if ! command -v ollama &> /dev/null; then
        echo -e "${YELLOW}📥 Installing Ollama...${NC}"
        curl -fsSL https://ollama.ai/install.sh | sh
    fi
    
    # Start Ollama in background
    OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* ollama serve > ollama.log 2>&1 &
    OLLAMA_PID=$!
    echo "Ollama started (PID: $OLLAMA_PID)"
    
    # Wait for Ollama to be ready
    echo -e "${YELLOW}⏳ Waiting for Ollama to start...${NC}"
    local attempt=1
    local max_attempts=30
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Ollama is ready!${NC}"
            break
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        echo -e "${RED}❌ Ollama failed to start${NC}"
        return 1
    fi
    
    # Pull required models
    echo -e "${YELLOW}📦 Ensuring LLM models are available...${NC}"
    
    # Check if llama3.1:8b is available
    if ! ollama list | grep -q "llama3.1:8b"; then
        echo -e "${YELLOW}📥 Pulling llama3.1:8b model...${NC}"
        ollama pull llama3.1:8b
    else
        echo -e "${GREEN}✅ llama3.1:8b model available${NC}"
    fi
    
    # Check backup model
    if ! ollama list | grep -q "qwen2.5:7b"; then
        echo -e "${YELLOW}📥 Pulling backup model qwen2.5:7b...${NC}"
        ollama pull qwen2.5:7b
    else
        echo -e "${GREEN}✅ qwen2.5:7b backup model available${NC}"
    fi
    
    return 0
}

# Function to test call analytics endpoints
test_call_analytics() {
    echo -e "${BLUE}🧪 Testing Call Analytics endpoints...${NC}"
    
    # Test main local calls endpoint
    if curl -s http://localhost:3000/api/webhooks/local-calls >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Local calls endpoint: WORKING${NC}"
    else
        echo -e "${RED}❌ Local calls endpoint: FAILED${NC}"
    fi
    
    # Test translation endpoint  
    if curl -s http://localhost:3000/api/webhooks/local-calls-translation >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Translation endpoint: WORKING${NC}"
    else
        echo -e "${RED}❌ Translation endpoint: FAILED${NC}"
    fi
    
    # Test simple endpoint
    if curl -s http://localhost:3000/api/webhooks/local-calls-simple >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Simple calls endpoint: WORKING${NC}"
    else
        echo -e "${RED}❌ Simple calls endpoint: FAILED${NC}"
    fi
    
    # Test call analytics dashboard
    if curl -s http://localhost:3000/tasks/dashboard/call-analytics >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Call Analytics Dashboard: WORKING${NC}"
    else
        echo -e "${RED}❌ Call Analytics Dashboard: FAILED${NC}"
    fi
}

# Function to display system URLs
display_system_urls() {
    echo ""
    echo -e "${GREEN}🎉 PERMANENT SYSTEM STARTUP COMPLETE!${NC}"
    echo "=========================================================================================="
    echo -e "${BLUE}📋 PERMANENT SYSTEM URLS:${NC}"
    echo -e "${GREEN}🌐 Main URL: https://api.ooak.photography${NC}"
    echo -e "${GREEN}📱 WhatsApp Webhook: https://api.ooak.photography/api/webhooks/whatsapp${NC}"
    echo -e "${GREEN}💻 Local Dashboard: http://localhost:3000${NC}"
    echo -e "${GREEN}📞 WhatsApp Business: +919677362524${NC}"
    echo ""
    echo -e "${CYAN}📊 SUPABASE SERVICES:${NC}"
    echo -e "${GREEN}🎨 Supabase Studio: http://127.0.0.1:54323${NC}"
    echo -e "${GREEN}🔑 Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres${NC}"
    echo -e "${GREEN}🚀 Supabase API: http://127.0.0.1:54321${NC}"
    echo -e "${GREEN}💾 Synced Data: Companies, Employees, Leads, Notifications & More${NC}"
    echo -e "${GREEN}🔗 Remote Linked: aavofqdzjhyfjygkxynq.supabase.co${NC}"
    echo ""
    echo -e "${PURPLE}📊 CALL ANALYTICS ENDPOINTS:${NC}"
    echo -e "${GREEN}🎙️  Local Calls: https://api.ooak.photography/api/webhooks/local-calls${NC}"
    echo -e "${GREEN}🌐 Translation: https://api.ooak.photography/api/webhooks/local-calls-translation${NC}"
    echo -e "${GREEN}📝 Simple Upload: https://api.ooak.photography/api/webhooks/local-calls-simple${NC}"
    echo -e "${GREEN}📊 Analytics Dashboard: https://api.ooak.photography/tasks/dashboard/call-analytics${NC}"
    echo ""
    echo -e "${PURPLE}🤖 AI SERVICES:${NC}"
    echo -e "${GREEN}🎵 Whisper Large-V3: Ready for Tamil/English transcription${NC}"
    echo -e "${GREEN}🧠 Ollama LLM: http://localhost:11434 (llama3.1:8b)${NC}"
    echo ""
    echo -e "${BLUE}🎯 INTERAKT WEBHOOK SETUP:${NC}"
    echo -e "${YELLOW}Update your Interakt webhook URL to:${NC}"
    echo -e "${GREEN}https://api.ooak.photography/api/webhooks/whatsapp${NC}"
    echo ""
    echo -e "${BLUE}🔧 SYSTEM MANAGEMENT:${NC}"
    echo "• View tunnel logs: tail -f tunnel.log"
    echo "• View Next.js logs: tail -f nextjs.log"
    echo "• View Ollama logs: tail -f ollama.log"
    echo "• View Supabase logs: supabase logs"
    echo "• Stop system: pkill -f 'cloudflared tunnel'; pkill -f 'next dev'; pkill -f 'ollama serve'"
    echo "• Stop Supabase: supabase stop"
    echo "• Sync data from remote: node sync-data.js"
    echo ""
    echo -e "${GREEN}✅ PERMANENT URL NEVER CHANGES - RESTART SAFE!${NC}"
    echo -e "${GREEN}✅ Your domain: ooak.photography${NC}"
    echo -e "${GREEN}✅ Professional API endpoint ready for production!${NC}"
    echo -e "${GREEN}✅ Call Analytics with Whisper Large-V3 ready!${NC}"
    echo -e "${GREEN}✅ Supabase Studio ready for database management!${NC}"
}

# Function to run database integrity check (optional)
run_database_integrity_check() {
    echo -e "${CYAN}🔍 Running database integrity check...${NC}"
    
    # Check if Python and psycopg2 are available
    if ! python -c "import psycopg2" 2>/dev/null; then
        echo -e "${YELLOW}⚠️ psycopg2 not available, skipping FK check${NC}"
        return 0
    fi
    
    # Check if our FK check script exists
    if [ ! -f "check_fk_mismatches.py" ]; then
        echo -e "${YELLOW}⚠️ FK check script not found, skipping integrity check${NC}"
        return 0
    fi
    
    # Run FK integrity check
    echo -e "${YELLOW}🔗 Validating foreign key relationships...${NC}"
    if python check_fk_mismatches.py; then
        echo -e "${GREEN}✅ Database foreign key integrity: PASSED${NC}"
        
        # Check if HTML report was generated
        if [ -f "fk_mismatch_log.html" ]; then
            echo -e "${BLUE}📊 FK Report: fk_mismatch_log.html${NC}"
        fi
    else
        echo -e "${RED}❌ Database integrity check: FAILED${NC}"
        echo -e "${YELLOW}💡 Check fk_mismatch_log.html for details${NC}"
    fi
}

# Function to enforce database protection
enforce_db_protection() {
    echo -e "${CYAN}🛡️ Enforcing database protection measures...${NC}"
    
    # 1. Check if protection script exists and run it
    if [ ! -f "db-protection.sh" ]; then
        echo -e "${RED}❌ Database protection script not found!${NC}"
        echo -e "${RED}❌ This is a critical error - cannot proceed without protection measures${NC}"
        exit 1
    fi
    
    # 2. Ensure .env exists and has protection flag
    if [ ! -f ".env" ] || ! grep -q "PREVENT_DB_RESET=true" ".env"; then
        echo -e "${RED}❌ Database protection flag not found!${NC}"
        echo -e "${YELLOW}⚠️ Running protection script...${NC}"
        bash db-protection.sh
    fi
    
    # 3. Override dangerous commands
    function supabase() {
        if [[ "$1" == "db" ]] && [[ "$2" == "reset" ]]; then
            echo -e "${RED}🚫 CRITICAL DATABASE PROTECTION ACTIVE${NC}"
            echo -e "${RED}❌ Database reset operation is strictly forbidden${NC}"
            echo -e "${YELLOW}⚠️ This is a business-critical database${NC}"
            echo -e "${YELLOW}💡 If you need to modify the database structure:${NC}"
            echo -e "${GREEN}1. Use migrations: supabase migration new <name>${NC}"
            echo -e "${GREEN}2. Apply migrations: supabase migration up${NC}"
            return 1
        fi
        command supabase "$@"
    }
    export -f supabase
    
    # 4. Set read-only permissions on critical files
    chmod 444 .env db-protection.sh 2>/dev/null || true
    
    echo -e "${GREEN}✅ Database protection measures enforced${NC}"
}

# MAIN STARTUP SEQUENCE
# =====================

# First, enforce database protection
enforce_db_protection

# Stop any existing processes
echo -e "${YELLOW}🛑 Stopping existing processes...${NC}"
pkill -f "next dev" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
pkill -f "ollama serve" 2>/dev/null || true
sleep 2

# Clear port 3000
echo -e "${YELLOW}🧹 Clearing port 3000...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Check and start Docker
if ! check_docker; then
    echo -e "${RED}❌ Docker is required for Supabase. Please install and start Docker.${NC}"
    exit 1
fi

# Start Supabase services first
if ! start_supabase; then
    echo -e "${YELLOW}⚠️ Supabase failed to start, continuing without it...${NC}"
else
    # Check if we have synced data, if not offer to sync
    company_count=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM companies;" 2>/dev/null | xargs)
    if [ "$company_count" = "0" ] 2>/dev/null || [ -z "$company_count" ]; then
        echo -e "${YELLOW}📊 No synced data found. Would you like to sync from remote? [y/N]${NC}"
        read -t 10 -n 1 -r sync_choice
        echo ""
        if [[ $sync_choice =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}🔄 Running data sync from remote Supabase...${NC}"
            if [ -f "sync-data.js" ]; then
                node sync-data.js
            else
                echo -e "${RED}❌ sync-data.js not found. Please run data sync manually later.${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️ Skipping data sync. Run 'node sync-data.js' later to sync data.${NC}"
        fi
    else
        echo -e "${GREEN}✅ Found $company_count companies in local database${NC}"
    fi
fi

# Check Python environment for Whisper
check_python_env

# Start Ollama LLM service
start_ollama

# Start Next.js server
echo -e "${YELLOW}⚡ Starting Next.js server...${NC}"
npm run dev > nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "Next.js started (PID: $NEXTJS_PID)"

# Wait for Next.js to be ready
wait_for_service "http://localhost:3000" "Next.js server"

# Start PERMANENT Cloudflare tunnel
echo -e "${YELLOW}🌐 Starting PERMANENT tunnel (ooak.photography)...${NC}"
cloudflared tunnel --config tunnel-config.yml run universal-ai-system > tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "Permanent tunnel started (PID: $TUNNEL_PID)"

# Wait for tunnel to be ready
wait_for_service "https://api.ooak.photography" "Permanent tunnel"

# Test all services
echo -e "${BLUE}🧪 Testing system...${NC}"

# Test local server
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Local server (http://localhost:3000): WORKING${NC}"
else
    echo -e "${RED}❌ Local server: FAILED${NC}"
fi

# Test permanent tunnel
if curl -s https://api.ooak.photography >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Permanent tunnel (https://api.ooak.photography): WORKING${NC}"
else
    echo -e "${RED}❌ Permanent tunnel: FAILED${NC}"
fi

# Test WhatsApp webhook
if curl -s "https://api.ooak.photography/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test&hub.verify_token=whatsapp_verify_123" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ WhatsApp webhook: WORKING${NC}"
else
    echo -e "${RED}❌ WhatsApp webhook: FAILED${NC}"
fi

# Test AI endpoint
if curl -s http://localhost:3000/api/ai-simple-test >/dev/null 2>&1; then
    echo -e "${GREEN}✅ AI endpoint: WORKING${NC}"
else
    echo -e "${RED}❌ AI endpoint: FAILED${NC}"
fi

# Test Ollama
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama LLM service: WORKING${NC}"
else
    echo -e "${RED}❌ Ollama LLM service: FAILED${NC}"
fi

# Test call analytics endpoints
test_call_analytics

# Test Supabase services
test_supabase_services

# Optional: Run database integrity check (set DB_INTEGRITY_CHECK=1 to enable)
if [ "$DB_INTEGRITY_CHECK" = "1" ]; then
    run_database_integrity_check
fi

# Check persistent storage
if [ -f "/data/whatsapp_messages.json" ]; then
    MESSAGE_COUNT=$(cat /data/whatsapp_messages.json | jq length 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Persistent storage: $MESSAGE_COUNT messages stored${NC}"
else
    echo -e "${YELLOW}⚠️ Persistent storage: No messages yet${NC}"
fi

# Display all URLs and info
display_system_urls 