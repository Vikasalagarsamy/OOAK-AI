#!/bin/bash

# Local Mac Development Setup Script
# This script sets up the task management application locally on macOS for testing

set -e

echo "🚀 Starting local Mac development setup..."

# =============================================================================
# CHECK PREREQUISITES
# =============================================================================

echo "🔍 Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop for Mac first."
    echo "Download from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is available and running"

# =============================================================================
# ENVIRONMENT SETUP
# =============================================================================

echo "📝 Setting up environment configuration..."

# Check if .env.local exists, if not create from example
if [ ! -f .env.local ]; then
    if [ -f env.runpod.example ]; then
        cp env.runpod.example .env.local
        echo "📄 Created .env.local from template"
        echo "⚠️  Please edit .env.local with your actual Supabase credentials"
        echo "   Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
        read -p "Press Enter after you've configured .env.local..."
    else
        echo "❌ No environment template found. Please create .env.local manually."
        exit 1
    fi
fi

# Source environment variables
if [ -f .env.local ]; then
    source .env.local
    echo "✅ Environment configuration loaded"
else
    echo "❌ .env.local not found. Please create it first."
    exit 1
fi

# =============================================================================
# OLLAMA SETUP (LOCAL)
# =============================================================================

echo "🤖 Setting up Ollama for local development..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📥 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo "✅ Ollama is already installed"
fi

# Start Ollama service (if not running)
if ! pgrep -x "ollama" > /dev/null; then
    echo "🚀 Starting Ollama service..."
    ollama serve &
    sleep 5
fi

# Pull required models
echo "📥 Downloading AI models (this may take a while)..."
ollama pull llama3.1:8b
ollama pull qwen2.5:7b

echo "✅ Ollama setup completed"

# =============================================================================
# APPLICATION SETUP
# =============================================================================

echo "🏗️ Setting up Next.js application..."

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f "pnpm-lock.yaml" ]; then
    pnpm install
elif [ -f "yarn.lock" ]; then
    yarn install
else
    npm install
fi

echo "✅ Dependencies installed"

# =============================================================================
# DOCKER SETUP (ALTERNATIVE TO PRODUCTION)
# =============================================================================

echo "🐳 Setting up Docker containers for local testing..."

# Create local docker-compose file
cat > docker-compose.local.yml << EOF
version: '3.8'

services:
  # Ollama LLM (using local installation)
  # Note: On Mac, we'll use the locally installed Ollama instead of Docker
  # because GPU passthrough to Docker on Mac is complex
  
  # Next.js Application (for production testing)
  task_management_app:
    build:
      context: .
      dockerfile: docker/Dockerfile.production
    container_name: task_management_web_local
    ports:
      - "3000:3000"
    environment:
      # Database Connection
      - NEXT_PUBLIC_SUPABASE_URL=\${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=\${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=\${SUPABASE_SERVICE_ROLE_KEY}
      
      # LLM Configuration (using host network)
      - LLM_ENDPOINT=http://host.docker.internal:11434
      - LLM_MODEL=llama3.1:8b
      - LLM_PROVIDER=ollama
      
      # Application Settings
      - NODE_ENV=production
      - NEXTAUTH_SECRET=\${NEXTAUTH_SECRET:-local-dev-secret}
      - NEXTAUTH_URL=http://localhost:3000
      
      # Security
      - CORS_ORIGIN=http://localhost:3000
      - API_SECRET_KEY=\${API_SECRET_KEY:-local-dev-api-key}
      
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

volumes:
  node_modules_cache:

networks:
  default:
    driver: bridge
EOF

echo "✅ Docker configuration created"

# =============================================================================
# DEVELOPMENT SCRIPTS
# =============================================================================

echo "📝 Creating development scripts..."

# Create start script
cat > start-local.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting local development environment..."

# Start Ollama if not running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 3
fi

# Check if models are available
echo "🔍 Checking AI models..."
ollama list | grep -E "(llama3.1:8b|qwen2.5:7b)" || {
    echo "📥 Pulling required models..."
    ollama pull llama3.1:8b
    ollama pull qwen2.5:7b
}

# Start Next.js development server
echo "🌐 Starting Next.js development server..."
npm run dev
EOF

# Create production test script
cat > test-production.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing production build locally..."

# Build and start production Docker container
docker-compose -f docker-compose.local.yml up --build

echo "🌐 Application should be available at http://localhost:3000"
EOF

# Make scripts executable
chmod +x start-local.sh test-production.sh

echo "✅ Development scripts created"

# =============================================================================
# COMPLETION
# =============================================================================

echo ""
echo "🎉 Local Mac setup completed successfully!"
echo ""
echo "🚀 Available Commands:"
echo "====================="
echo "Development mode:    ./start-local.sh"
echo "Production test:     ./test-production.sh"
echo "Stop production:     docker-compose -f docker-compose.local.yml down"
echo ""
echo "🌐 Access URLs:"
echo "==============="
echo "Development:         http://localhost:3000"
echo "Ollama API:          http://localhost:11434"
echo "Health Check:        http://localhost:3000/api/health"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Make sure .env.local has your Supabase credentials"
echo "2. Run './start-local.sh' for development"
echo "3. Run './test-production.sh' to test production build"
echo "4. For actual RunPod deployment, use the runpod-setup.sh script on a Linux instance"
echo ""
echo "✅ Ready for local development and testing!" 