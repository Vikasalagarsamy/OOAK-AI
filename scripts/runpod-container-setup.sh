#!/bin/bash

# RunPod Container-Friendly Setup Script
# This version works without systemd in container environments

set -e

echo "🚀 Starting RunPod container deployment setup..."

# =============================================================================
# CONFIGURATION
# =============================================================================

APP_NAME="task-management-system"
LLM_MODEL=${LLM_MODEL:-"llama3.1:8b"}
BACKUP_MODEL=${BACKUP_MODEL:-"qwen2.5:7b"}

# =============================================================================
# ENVIRONMENT CHECK
# =============================================================================

echo "🔍 Checking environment..."

# Check if we're in the right directory
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found. Please make sure you're in the IMPORTANT directory and have configured your environment."
    exit 1
fi

echo "✅ Environment file found"

# =============================================================================
# DOCKER SETUP (Container-friendly)
# =============================================================================

echo "🐳 Setting up Docker services..."

# Start Docker daemon if not running
if ! docker info >/dev/null 2>&1; then
    echo "🚀 Starting Docker daemon..."
    dockerd > /var/log/docker.log 2>&1 &
    sleep 10
    
    # Wait for Docker to be ready
    timeout=60
    counter=0
    while ! docker info >/dev/null 2>&1; do
        if [ $counter -gt $timeout ]; then
            echo "❌ Timeout waiting for Docker to start"
            exit 1
        fi
        echo "Waiting for Docker... ($counter/$timeout)"
        sleep 2
        counter=$((counter + 2))
    done
fi

echo "✅ Docker is running"

# =============================================================================
# OLLAMA SETUP
# =============================================================================

echo "🤖 Setting up Ollama LLM service..."

# Pull and start Ollama
echo "📥 Starting Ollama container..."
docker run -d \
    --name ollama \
    --gpus all \
    -p 11434:11434 \
    -v ollama_data:/root/.ollama \
    -e OLLAMA_HOST=0.0.0.0 \
    -e OLLAMA_ORIGINS=* \
    --restart unless-stopped \
    ollama/ollama

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
timeout=120
counter=0
while ! curl -s http://localhost:11434/api/tags > /dev/null; do
    if [ $counter -gt $timeout ]; then
        echo "❌ Timeout waiting for Ollama to start"
        docker logs ollama
        exit 1
    fi
    echo "Waiting for Ollama... ($counter/$timeout)"
    sleep 3
    counter=$((counter + 3))
done

echo "✅ Ollama is ready"

# Pull LLM models
echo "📥 Downloading AI models (this will take several minutes)..."
echo "Downloading $LLM_MODEL..."
docker exec ollama ollama pull $LLM_MODEL || {
    echo "⚠️ Primary model download failed, trying alternative..."
    docker exec ollama ollama pull llama3.1:latest
}

echo "Downloading $BACKUP_MODEL..."
docker exec ollama ollama pull $BACKUP_MODEL || {
    echo "⚠️ Backup model download failed, trying alternative..."
    docker exec ollama ollama pull qwen2.5:latest
}

echo "✅ AI models downloaded"

# Test Ollama
echo "🧪 Testing Ollama API..."
curl -s http://localhost:11434/api/tags || {
    echo "❌ Ollama API test failed"
    docker logs ollama
    exit 1
}

echo "✅ Ollama API is working"

# =============================================================================
# APPLICATION BUILD
# =============================================================================

echo "🏗️ Building Next.js application..."

# Check if we have Node.js for build (if not, use Docker)
if ! command -v node &> /dev/null; then
    echo "📦 Building application with Docker..."
    
    # Build the application image
    docker build -f docker/Dockerfile.production -t task-management-app .
    
    echo "✅ Application built successfully"
else
    echo "📦 Building application with local Node.js..."
    
    # Install dependencies and build
    npm install
    npm run build
    
    echo "✅ Application built successfully"
fi

# =============================================================================
# APPLICATION DEPLOYMENT
# =============================================================================

echo "🚀 Deploying application..."

# Source environment variables
source .env.production

# Create docker-compose.yml for production
cat > docker-compose.production.yml << EOF
version: '3.8'

services:
  # Next.js Application
  task_management_app:
    image: task-management-app
    container_name: task_management_web
    ports:
      - "3000:3000"
    environment:
      # Database Connection
      - NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
      - SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
      
      # LLM Configuration
      - LLM_ENDPOINT=http://host.docker.internal:11434
      - LLM_MODEL=$LLM_MODEL
      - LLM_PROVIDER=ollama
      
      # Application Settings
      - NODE_ENV=production
      - NEXTAUTH_SECRET=\${NEXTAUTH_SECRET:-$(openssl rand -base64 32)}
      - NEXTAUTH_URL=http://localhost:3000
      
      # Security
      - CORS_ORIGIN=http://localhost:3000
      - API_SECRET_KEY=\${API_SECRET_KEY:-$(openssl rand -base64 32)}
      
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

networks:
  default:
    driver: bridge
EOF

# Start the application
echo "🌐 Starting application container..."
docker-compose -f docker-compose.production.yml up -d

# Wait for application to be ready
echo "⏳ Waiting for application to start..."
timeout=60
counter=0
while ! curl -s http://localhost:3000/api/health > /dev/null; do
    if [ $counter -gt $timeout ]; then
        echo "❌ Timeout waiting for application to start"
        docker-compose -f docker-compose.production.yml logs
        exit 1
    fi
    echo "Waiting for application... ($counter/$timeout)"
    sleep 3
    counter=$((counter + 3))
done

echo "✅ Application is running"

# =============================================================================
# NGINX CONFIGURATION (Simple)
# =============================================================================

echo "🔧 Setting up Nginx reverse proxy..."

# Create simple nginx config
cat > /etc/nginx/sites-available/task-management << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # LLM API endpoint
    location /api/llm/ {
        proxy_pass http://localhost:11434/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 600;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
EOF

# Enable the site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/task-management /etc/nginx/sites-enabled/

# Test nginx config
nginx -t || {
    echo "❌ Nginx configuration test failed"
    exit 1
}

# Start nginx
nginx || {
    echo "⚠️ Starting nginx in background..."
    nginx -g "daemon off;" &
}

echo "✅ Nginx configured and running"

# =============================================================================
# MONITORING SCRIPTS
# =============================================================================

echo "📊 Setting up monitoring..."

# Create health check script
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash

echo "🔍 System Health Check - $(date)"
echo "=================================="

# Check Docker
if docker info >/dev/null 2>&1; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is not running"
fi

# Check containers
echo ""
echo "📦 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check services
echo ""
echo "🌐 Service Health:"
if curl -s -f "http://localhost:3000/api/health" > /dev/null; then
    echo "✅ Next.js Application is healthy"
else
    echo "❌ Next.js Application is unhealthy"
fi

if curl -s -f "http://localhost:11434/api/tags" > /dev/null; then
    echo "✅ LLM Service (Ollama) is healthy"
else
    echo "❌ LLM Service (Ollama) is unhealthy"
fi

# Check GPU (if available)
if command -v nvidia-smi &> /dev/null; then
    echo ""
    echo "🖥️ GPU Status:"
    nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits
fi

echo ""
echo "✅ Health check completed"
EOF

chmod +x /usr/local/bin/health-check.sh

echo "✅ Monitoring setup completed"

# =============================================================================
# COMPLETION
# =============================================================================

echo ""
echo "🎉 RunPod container deployment completed successfully!"
echo ""
echo "📋 Service Status:"
echo "=================="
docker ps

echo ""
echo "🌐 Access URLs:"
echo "==============="
echo "Application: http://localhost:3000"
echo "LLM API: http://localhost:11434"
echo "Health Check: http://localhost:3000/api/health"

echo ""
echo "🔧 Management Commands:"
echo "======================"
echo "Health Check: /usr/local/bin/health-check.sh"
echo "View App Logs: docker logs task_management_web"
echo "View LLM Logs: docker logs ollama"
echo "Restart App: docker-compose -f docker-compose.production.yml restart"

echo ""
echo "🧪 Quick Test:"
echo "============="
/usr/local/bin/health-check.sh

echo ""
echo "✅ Your task management system with local LLM is ready!"
echo "🚀 Access your application at the RunPod public URL (port 3000)" 