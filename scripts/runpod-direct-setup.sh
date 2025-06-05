#!/bin/bash

# RunPod Direct Setup Script
# This version installs services directly without Docker-in-Docker

set -e

echo "🚀 Starting RunPod direct deployment setup..."

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
# SYSTEM DEPENDENCIES
# =============================================================================

echo "📦 Installing system dependencies..."

# Update package lists
apt-get update

# Install required packages
apt-get install -y \
    curl \
    wget \
    nginx \
    supervisor \
    build-essential \
    python3 \
    python3-pip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

echo "✅ System dependencies installed"

# =============================================================================
# NODE.JS SETUP
# =============================================================================

echo "📦 Setting up Node.js..."

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version

echo "✅ Node.js installed"

# =============================================================================
# OLLAMA SETUP
# =============================================================================

echo "🤖 Setting up Ollama LLM service..."

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Create ollama user if it doesn't exist
if ! id "ollama" &>/dev/null; then
    useradd -r -s /bin/false -m -d /usr/share/ollama ollama
fi

# Set up Ollama service directory
mkdir -p /etc/systemd/system
mkdir -p /usr/share/ollama
chown ollama:ollama /usr/share/ollama

# Create Ollama service configuration for supervisor
cat > /etc/supervisor/conf.d/ollama.conf << 'EOF'
[program:ollama]
command=/usr/local/bin/ollama serve
user=ollama
directory=/usr/share/ollama
environment=OLLAMA_HOST=0.0.0.0,OLLAMA_ORIGINS=*,OLLAMA_MODELS=/usr/share/ollama/.ollama/models
autostart=true
autorestart=true
stderr_logfile=/var/log/ollama.err.log
stdout_logfile=/var/log/ollama.out.log
redirect_stderr=true
EOF

# Start supervisor to run Ollama
supervisorctl reread
supervisorctl update
supervisorctl start ollama

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
timeout=120
counter=0
while ! curl -s http://localhost:11434/api/tags > /dev/null; do
    if [ $counter -gt $timeout ]; then
        echo "❌ Timeout waiting for Ollama to start"
        supervisorctl status ollama
        tail -50 /var/log/ollama.out.log
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
sudo -u ollama /usr/local/bin/ollama pull $LLM_MODEL || {
    echo "⚠️ Primary model download failed, trying alternative..."
    sudo -u ollama /usr/local/bin/ollama pull llama3.1:latest
}

echo "Downloading $BACKUP_MODEL..."
sudo -u ollama /usr/local/bin/ollama pull $BACKUP_MODEL || {
    echo "⚠️ Backup model download failed, trying alternative..."
    sudo -u ollama /usr/local/bin/ollama pull qwen2.5:latest
}

echo "✅ AI models downloaded"

# Test Ollama
echo "🧪 Testing Ollama API..."
curl -s http://localhost:11434/api/tags || {
    echo "❌ Ollama API test failed"
    supervisorctl status ollama
    tail -50 /var/log/ollama.out.log
    exit 1
}

echo "✅ Ollama API is working"

# =============================================================================
# APPLICATION BUILD
# =============================================================================

echo "🏗️ Building Next.js application..."

# Source environment variables
source .env.production

# Install dependencies
npm install

# Build the application
npm run build

echo "✅ Application built successfully"

# =============================================================================
# APPLICATION DEPLOYMENT
# =============================================================================

echo "🚀 Setting up application service..."

# Create application startup script
cat > /usr/local/bin/start-app.sh << 'EOF'
#!/bin/bash
cd /IMPORTANT
source .env.production

export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
export LLM_ENDPOINT="http://localhost:11434"
export LLM_MODEL="llama3.1:8b"
export LLM_PROVIDER="ollama"
export NODE_ENV="production"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-$(openssl rand -base64 32)}"
export NEXTAUTH_URL="http://localhost:3000"
export CORS_ORIGIN="http://localhost:3000"
export API_SECRET_KEY="${API_SECRET_KEY:-$(openssl rand -base64 32)}"

npm start
EOF

chmod +x /usr/local/bin/start-app.sh

# Create supervisor configuration for the app
cat > /etc/supervisor/conf.d/task-management-app.conf << 'EOF'
[program:task-management-app]
command=/usr/local/bin/start-app.sh
directory=/IMPORTANT
autostart=true
autorestart=true
stderr_logfile=/var/log/task-management-app.err.log
stdout_logfile=/var/log/task-management-app.out.log
redirect_stderr=true
user=root
environment=HOME="/root",USER="root"
EOF

# Reload supervisor and start the app
supervisorctl reread
supervisorctl update
supervisorctl start task-management-app

# Wait for application to be ready
echo "⏳ Waiting for application to start..."
timeout=60
counter=0
while ! curl -s http://localhost:3000 > /dev/null; do
    if [ $counter -gt $timeout ]; then
        echo "❌ Timeout waiting for application to start"
        supervisorctl status task-management-app
        tail -50 /var/log/task-management-app.out.log
        exit 1
    fi
    echo "Waiting for application... ($counter/$timeout)"
    sleep 3
    counter=$((counter + 3))
done

echo "✅ Application is running"

# =============================================================================
# NGINX CONFIGURATION
# =============================================================================

echo "🔧 Setting up Nginx reverse proxy..."

# Create nginx config
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
service nginx start || nginx

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

# Check supervisor processes
echo "📦 Service Status:"
supervisorctl status

# Check services
echo ""
echo "🌐 Service Health:"
if curl -s -f "http://localhost:3000" > /dev/null; then
    echo "✅ Next.js Application is healthy"
else
    echo "❌ Next.js Application is unhealthy"
fi

if curl -s -f "http://localhost:11434/api/tags" > /dev/null; then
    echo "✅ LLM Service (Ollama) is healthy"
else
    echo "❌ LLM Service (Ollama) is unhealthy"
fi

# Check nginx
if pgrep nginx > /dev/null; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
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

# Create service management script
cat > /usr/local/bin/manage-services.sh << 'EOF'
#!/bin/bash

case "$1" in
    start)
        supervisorctl start all
        service nginx start
        echo "✅ All services started"
        ;;
    stop)
        supervisorctl stop all
        service nginx stop
        echo "✅ All services stopped"
        ;;
    restart)
        supervisorctl restart all
        service nginx restart
        echo "✅ All services restarted"
        ;;
    status)
        /usr/local/bin/health-check.sh
        ;;
    logs)
        if [ -z "$2" ]; then
            echo "Usage: $0 logs [ollama|app|nginx]"
        else
            case "$2" in
                ollama)
                    tail -f /var/log/ollama.out.log
                    ;;
                app)
                    tail -f /var/log/task-management-app.out.log
                    ;;
                nginx)
                    tail -f /var/log/nginx/access.log
                    ;;
                *)
                    echo "Available logs: ollama, app, nginx"
                    ;;
            esac
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo "  logs: specify service - ollama, app, nginx"
        ;;
esac
EOF

chmod +x /usr/local/bin/manage-services.sh

echo "✅ Monitoring setup completed"

# =============================================================================
# COMPLETION
# =============================================================================

echo ""
echo "🎉 RunPod direct deployment completed successfully!"
echo ""
echo "📋 Service Status:"
echo "=================="
supervisorctl status

echo ""
echo "🌐 Access URLs:"
echo "==============="
echo "Application: http://localhost:3000"
echo "LLM API: http://localhost:11434"

echo ""
echo "🔧 Management Commands:"
echo "======================"
echo "Health Check: /usr/local/bin/health-check.sh"
echo "Manage Services: /usr/local/bin/manage-services.sh {start|stop|restart|status}"
echo "View Logs: /usr/local/bin/manage-services.sh logs {ollama|app|nginx}"

echo ""
echo "🧪 Quick Test:"
echo "============="
/usr/local/bin/health-check.sh

echo ""
echo "✅ Your task management system with local LLM is ready!"
echo "🚀 Access your application at the RunPod public URL" 