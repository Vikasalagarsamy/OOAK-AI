#!/bin/bash

# 🚀 OOAK UNIFIED SYSTEM - COMPLETE REWRITE
# ==========================================
# Replaces Supabase with PostgreSQL + Dual Domain Architecture
# 
# ARCHITECTURE:
# ├── api.ooak.photography (WhatsApp) → Port 3000 → ooak_future_production
# ├── workspace.ooak.photography (Employees) → Port 4000 → ooak_future_production  
# └── Development → Port 5000 → ooak_future_development

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 STARTING OOAK UNIFIED SYSTEM - POSTGRESQL ARCHITECTURE${NC}"
echo "============================================================================"
echo -e "${GREEN}✅ WhatsApp Automation: api.ooak.photography → Port 3000 → Production DB${NC}"
echo -e "${GREEN}✅ Employee Workspace: workspace.ooak.photography → Port 4000 → Production DB${NC}"
echo -e "${GREEN}✅ Development Environment: localhost:5000 → Development DB${NC}"
echo -e "${GREEN}✅ AI Services: Ollama + Whisper (Development)${NC}"
echo ""

# Database Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="vikasalagarsamy"
DB_PRODUCTION="ooak_future_production"
DB_DEVELOPMENT="ooak_future_development"

# Service Ports
PORT_WHATSAPP=3000      # WhatsApp automation (Production DB)
PORT_WORKSPACE=4000     # Employee workspace (Production DB)  
PORT_DEVELOPMENT=5000   # Development (Development DB)
PORT_OLLAMA=11434       # AI services

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

# Function to check PostgreSQL connection
check_postgresql() {
    echo -e "${CYAN}🐘 Checking PostgreSQL connection...${NC}"
    
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}❌ PostgreSQL client (psql) not installed${NC}"
        echo -e "${YELLOW}💡 Install with: brew install postgresql${NC}"
        return 1
    fi
    
    # Test connection
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"
        return 0
    else
        echo -e "${RED}❌ PostgreSQL connection failed${NC}"
        echo -e "${YELLOW}💡 Please ensure PostgreSQL is running and credentials are correct${NC}"
        return 1
    fi
}

# Function to create databases if they don't exist
create_databases() {
    echo -e "${CYAN}🗄️ Setting up databases...${NC}"
    
    # Create production database
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -lqt | cut -d \| -f 1 | grep -qw $DB_PRODUCTION; then
        echo -e "${GREEN}✅ Production database ($DB_PRODUCTION) exists${NC}"
    else
        echo -e "${YELLOW}📦 Creating production database...${NC}"
        createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_PRODUCTION
        echo -e "${GREEN}✅ Production database created${NC}"
    fi
    
    # Create development database
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -lqt | cut -d \| -f 1 | grep -qw $DB_DEVELOPMENT; then
        echo -e "${GREEN}✅ Development database ($DB_DEVELOPMENT) exists${NC}"
    else
        echo -e "${YELLOW}📦 Creating development database...${NC}"
        createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_DEVELOPMENT
        echo -e "${GREEN}✅ Development database created${NC}"
    fi
    
    # Migrate existing data if needed
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -lqt | cut -d \| -f 1 | grep -qw "ooak_future"; then
        echo -e "${YELLOW}🔄 Found existing ooak_future database, migrating to production...${NC}"
        pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER ooak_future | psql -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_PRODUCTION
        echo -e "${GREEN}✅ Data migrated to production database${NC}"
    fi
}

# Function to check Python environment for AI services
check_python_env() {
    echo -e "${YELLOW}🐍 Checking Python environment for AI services...${NC}"
    
    # Check if whisper-env exists
    if [ -d "whisper-env" ]; then
        echo -e "${GREEN}✅ Whisper Python environment found${NC}"
        
        # Activate and test
        source whisper-env/bin/activate
        
        # Check faster-whisper
        if python -c "import faster_whisper" 2>/dev/null; then
            echo -e "${GREEN}✅ faster-whisper is available${NC}"
        else
            echo -e "${YELLOW}📦 Installing faster-whisper...${NC}"
            pip install faster-whisper
        fi
        
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

# Function to start Ollama (Development only)
start_ollama() {
    echo -e "${PURPLE}🤖 Starting Ollama LLM service (Development)...${NC}"
    
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
        if curl -s http://localhost:$PORT_OLLAMA/api/tags >/dev/null 2>&1; then
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
    
    # Pull required models for development
    echo -e "${YELLOW}📦 Ensuring LLM models are available...${NC}"
    
    if ! ollama list | grep -q "llama3.1:8b"; then
        echo -e "${YELLOW}📥 Pulling llama3.1:8b model...${NC}"
        ollama pull llama3.1:8b
    else
        echo -e "${GREEN}✅ llama3.1:8b model available${NC}"
    fi
}

# Function to create environment-specific configs
create_environment_configs() {
    echo -e "${CYAN}🔧 Creating environment configurations...${NC}"
    
    # WhatsApp service config (Port 3000 → Production DB)
    cat > .env.whatsapp << EOF
NODE_ENV=production
POSTGRES_HOST=$DB_HOST
POSTGRES_PORT=$DB_PORT
POSTGRES_USER=$DB_USER
POSTGRES_DATABASE=$DB_PRODUCTION
POSTGRES_PASSWORD=
SERVICE_NAME=whatsapp-automation
SERVICE_PORT=$PORT_WHATSAPP
DOMAIN=api.ooak.photography
EOF

    # Employee workspace config (Port 4000 → Production DB)
    cat > .env.workspace << EOF
NODE_ENV=production
POSTGRES_HOST=$DB_HOST
POSTGRES_PORT=$DB_PORT
POSTGRES_USER=$DB_USER
POSTGRES_DATABASE=$DB_PRODUCTION
POSTGRES_PASSWORD=
SERVICE_NAME=employee-workspace
SERVICE_PORT=$PORT_WORKSPACE
DOMAIN=workspace.ooak.photography
EOF

    # Development config (Port 5000 → Development DB)
    cat > .env.development << EOF
NODE_ENV=development
POSTGRES_HOST=$DB_HOST
POSTGRES_PORT=$DB_PORT
POSTGRES_USER=$DB_USER
POSTGRES_DATABASE=$DB_DEVELOPMENT
POSTGRES_PASSWORD=
SERVICE_NAME=development
SERVICE_PORT=$PORT_DEVELOPMENT
OLLAMA_ENABLED=true
WHISPER_ENABLED=true
EOF

    echo -e "${GREEN}✅ Environment configurations created${NC}"
}

# Function to start services
start_services() {
    echo -e "${YELLOW}⚡ Starting all services...${NC}"
    
    # Stop any existing processes first
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    sleep 2
    
    # Clear ports
    for port in $PORT_WHATSAPP $PORT_WORKSPACE $PORT_DEVELOPMENT; do
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    done
    
    # Start WhatsApp service (Port 3000 → Production DB)
    echo -e "${YELLOW}📱 Starting WhatsApp automation service...${NC}"
    env $(cat .env.whatsapp | xargs) npm run dev -- --port $PORT_WHATSAPP > whatsapp-service.log 2>&1 &
    WHATSAPP_PID=$!
    echo "WhatsApp service started (PID: $WHATSAPP_PID)"
    
    # Start Employee workspace service (Port 4000 → Production DB)
    echo -e "${YELLOW}💼 Starting employee workspace service...${NC}"
    env $(cat .env.workspace | xargs) npm run dev -- --port $PORT_WORKSPACE > workspace-service.log 2>&1 &
    WORKSPACE_PID=$!
    echo "Workspace service started (PID: $WORKSPACE_PID)"
    
    # Start Development service (Port 5000 → Development DB)
    echo -e "${YELLOW}🛠️ Starting development service...${NC}"
    env $(cat .env.development | xargs) npm run dev -- --port $PORT_DEVELOPMENT > development-service.log 2>&1 &
    DEVELOPMENT_PID=$!
    echo "Development service started (PID: $DEVELOPMENT_PID)"
    
    # Wait for services to be ready
    wait_for_service "http://localhost:$PORT_WHATSAPP" "WhatsApp service"
    wait_for_service "http://localhost:$PORT_WORKSPACE" "Workspace service"
    wait_for_service "http://localhost:$PORT_DEVELOPMENT" "Development service"
}

# Function to create dual tunnel configuration
create_tunnel_config() {
    echo -e "${YELLOW}🌐 Creating dual tunnel configuration...${NC}"
    
    cat > tunnel-config-unified.yml << EOF
tunnel: 1ff1c831-f990-44e6-8b8e-b5d0027e8af7
credentials-file: /Users/vikasalagarsamy/.cloudflared/1ff1c831-f990-44e6-8b8e-b5d0027e8af7.json

ingress:
  # WhatsApp Automations - Port 3000 (Production DB)
  - hostname: api.ooak.photography
    service: http://localhost:$PORT_WHATSAPP
  
  # Employee Workspace - Port 4000 (Production DB)
  - hostname: workspace.ooak.photography
    service: http://localhost:$PORT_WORKSPACE
  
  # Fallback for any other requests
  - service: http_status:404
EOF

    echo -e "${GREEN}✅ Tunnel configuration created${NC}"
}

# Function to start tunnel
start_tunnel() {
    echo -e "${YELLOW}🌐 Starting unified tunnel...${NC}"
    
    cloudflared tunnel --config tunnel-config-unified.yml run ooak-tunnel > tunnel-unified.log 2>&1 &
    TUNNEL_PID=$!
    echo "Unified tunnel started (PID: $TUNNEL_PID)"
    
    # Wait for tunnel to be ready
    sleep 10
}

# Function to test all services
test_services() {
    echo -e "${BLUE}🧪 Testing all services...${NC}"
    
    # Test local services
    echo -e "${CYAN}🖥️ Local Services:${NC}"
    
    if curl -s http://localhost:$PORT_WHATSAPP >/dev/null 2>&1; then
        echo -e "${GREEN}✅ WhatsApp service (port $PORT_WHATSAPP): WORKING${NC}"
    else
        echo -e "${RED}❌ WhatsApp service: FAILED${NC}"
    fi
    
    if curl -s http://localhost:$PORT_WORKSPACE >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Workspace service (port $PORT_WORKSPACE): WORKING${NC}"
    else
        echo -e "${RED}❌ Workspace service: FAILED${NC}"
    fi
    
    if curl -s http://localhost:$PORT_DEVELOPMENT >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Development service (port $PORT_DEVELOPMENT): WORKING${NC}"
    else
        echo -e "${RED}❌ Development service: FAILED${NC}"
    fi
    
    # Test public domains
    echo -e "${CYAN}🌐 Public Domains:${NC}"
    
    if curl -s "https://api.ooak.photography" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ WhatsApp domain (api.ooak.photography): WORKING${NC}"
    else
        echo -e "${RED}❌ WhatsApp domain: FAILED${NC}"
    fi
    
    if curl -s "https://workspace.ooak.photography" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Workspace domain (workspace.ooak.photography): WORKING${NC}"
    else
        echo -e "${RED}❌ Workspace domain: FAILED${NC}"
    fi
    
    # Test AI services (Development only)
    echo -e "${CYAN}🤖 AI Services (Development):${NC}"
    
    if curl -s http://localhost:$PORT_OLLAMA/api/tags >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Ollama LLM service: WORKING${NC}"
    else
        echo -e "${RED}❌ Ollama LLM service: FAILED${NC}"
    fi
    
    # Test database connections
    echo -e "${CYAN}🗄️ Database Connections:${NC}"
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_PRODUCTION -c "SELECT 1" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Production database: CONNECTED${NC}"
    else
        echo -e "${RED}❌ Production database: FAILED${NC}"
    fi
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DEVELOPMENT -c "SELECT 1" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Development database: CONNECTED${NC}"
    else
        echo -e "${RED}❌ Development database: FAILED${NC}"
    fi
}

# Function to save process information
save_process_info() {
    echo -e "${YELLOW}💾 Saving process information...${NC}"
    
    cat > unified-processes.txt << EOF
WHATSAPP_PID=${WHATSAPP_PID:-$(lsof -ti:$PORT_WHATSAPP)}
WORKSPACE_PID=${WORKSPACE_PID:-$(lsof -ti:$PORT_WORKSPACE)}
DEVELOPMENT_PID=${DEVELOPMENT_PID:-$(lsof -ti:$PORT_DEVELOPMENT)}
TUNNEL_PID=${TUNNEL_PID}
OLLAMA_PID=${OLLAMA_PID:-$(pgrep -f "ollama serve")}
STARTED=$(date)
WHATSAPP_PORT=$PORT_WHATSAPP
WORKSPACE_PORT=$PORT_WORKSPACE
DEVELOPMENT_PORT=$PORT_DEVELOPMENT
PRODUCTION_DB=$DB_PRODUCTION
DEVELOPMENT_DB=$DB_DEVELOPMENT
EOF

    echo -e "${GREEN}✅ Process information saved to unified-processes.txt${NC}"
}

# Function to display system information
display_system_info() {
    echo ""
    echo -e "${GREEN}🎉 OOAK UNIFIED SYSTEM STARTUP COMPLETE!${NC}"
    echo "============================================================================"
    echo ""
    echo -e "${BLUE}🌐 PUBLIC DOMAINS:${NC}"
    echo -e "${GREEN}📱 WhatsApp Automation: https://api.ooak.photography${NC}"
    echo -e "${GREEN}💼 Employee Workspace: https://workspace.ooak.photography${NC}"
    echo ""
    echo -e "${BLUE}🖥️ LOCAL SERVICES:${NC}"
    echo -e "${GREEN}📱 WhatsApp (Production DB): http://localhost:$PORT_WHATSAPP${NC}"
    echo -e "${GREEN}💼 Workspace (Production DB): http://localhost:$PORT_WORKSPACE${NC}"
    echo -e "${GREEN}🛠️ Development (Development DB): http://localhost:$PORT_DEVELOPMENT${NC}"
    echo ""
    echo -e "${BLUE}🗄️ DATABASES:${NC}"
    echo -e "${GREEN}🏭 Production: $DB_PRODUCTION (Ports $PORT_WHATSAPP, $PORT_WORKSPACE)${NC}"
    echo -e "${GREEN}🛠️ Development: $DB_DEVELOPMENT (Port $PORT_DEVELOPMENT)${NC}"
    echo ""
    echo -e "${BLUE}🤖 AI SERVICES (Development):${NC}"
    echo -e "${GREEN}🧠 Ollama LLM: http://localhost:$PORT_OLLAMA${NC}"
    echo -e "${GREEN}🎵 Whisper: Available in development environment${NC}"
    echo ""
    echo -e "${BLUE}🔧 MANAGEMENT COMMANDS:${NC}"
    echo "• Stop all services: ./stop-all-services.sh"
    echo "• Sync prod→dev: ./sync-prod-to-dev.sh"
    echo "• Apply schema to prod: ./apply-to-production.sh schema.sql"
    echo "• View logs: tail -f whatsapp-service.log workspace-service.log"
    echo "• Check status: curl https://api.ooak.photography"
    echo ""
    echo -e "${YELLOW}💡 WhatsApp webhook URL: https://api.ooak.photography/api/webhooks/whatsapp${NC}"
    echo -e "${YELLOW}💡 Employee login: https://workspace.ooak.photography/login${NC}"
    echo -e "${GREEN}✅ All URLs are permanent and restart-safe!${NC}"
}

# MAIN STARTUP SEQUENCE
# =====================

echo -e "${YELLOW}🔍 Step 1: Checking PostgreSQL...${NC}"
if ! check_postgresql; then
    exit 1
fi

echo -e "${YELLOW}🗄️ Step 2: Setting up databases...${NC}"
create_databases

echo -e "${YELLOW}🔧 Step 3: Creating environment configs...${NC}"
create_environment_configs

echo -e "${YELLOW}🐍 Step 4: Checking Python environment...${NC}"
check_python_env

echo -e "${YELLOW}🤖 Step 5: Starting AI services...${NC}"
start_ollama

echo -e "${YELLOW}⚡ Step 6: Starting all services...${NC}"
start_services

echo -e "${YELLOW}🌐 Step 7: Creating tunnel configuration...${NC}"
create_tunnel_config

echo -e "${YELLOW}🚀 Step 8: Starting tunnel...${NC}"
start_tunnel

echo -e "${YELLOW}🧪 Step 9: Testing all services...${NC}"
test_services

echo -e "${YELLOW}💾 Step 10: Saving process information...${NC}"
save_process_info

# Display final system information
display_system_info 