#!/bin/bash

# RunPod Continue Setup Script
# Fixes remaining issues and completes the deployment

set -e

echo "🔧 Fixing remaining setup issues..."

# =============================================================================
# FIX DEPENDENCIES
# =============================================================================

echo "📦 Installing missing dependencies..."

# Install sudo
apt-get update && apt-get install -y sudo

echo "✅ Dependencies fixed"

# =============================================================================
# FIX ENV FILE
# =============================================================================

echo "🔧 Fixing .env.production file..."

# Remove any lines with just equals signs or comments with equals
sed -i '/^[[:space:]]*=\+[[:space:]]*$/d' .env.production
sed -i '/^[[:space:]]*#.*=\+.*$/d' .env.production

echo "✅ Environment file fixed"

# =============================================================================
# DOWNLOAD MODELS
# =============================================================================

echo "📥 Downloading AI models..."

# Download models directly (we're already root)
echo "Downloading llama3.1:8b..."
/usr/local/bin/ollama pull llama3.1:8b || echo "⚠️ Model download failed, but continuing..."

echo "Downloading qwen2.5:7b..."
/usr/local/bin/ollama pull qwen2.5:7b || echo "⚠️ Backup model download failed, but continuing..."

echo "✅ Model download completed"

# =============================================================================
# BUILD APPLICATION
# =============================================================================

echo "🏗️ Building Next.js application..."

# Source environment variables carefully
if [ -f ".env.production" ]; then
    # Only source valid lines
    set -a
    source <(grep -v '^\s*#' .env.production | grep -v '^\s*$' | grep '=')
    set +a
fi

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

echo "✅ Application built successfully"

# =============================================================================
# COMPLETE DEPLOYMENT
# =============================================================================

echo "🚀 Completing deployment..."

# Create application startup script
cat > /usr/local/bin/start-app.sh << 'EOF'
#!/bin/bash
cd /IMPORTANT

# Source environment variables safely
if [ -f ".env.production" ]; then
    set -a
    source <(grep -v '^\s*#' .env.production | grep -v '^\s*$' | grep '=')
    set +a
fi

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
        echo "Application status:"
        supervisorctl status task-management-app
        echo "Application logs:"
        tail -20 /var/log/task-management-app.out.log 2>/dev/null || echo "No output logs"
        tail -20 /var/log/task-management-app.err.log 2>/dev/null || echo "No error logs"
        break
    fi
    echo "Waiting for application... ($counter/$timeout)"
    sleep 3
    counter=$((counter + 3))
done

# Setup Nginx
echo "🔧 Setting up Nginx..."

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

# Test and start nginx
nginx -t && service nginx start

echo "✅ Nginx configured and running"

# =============================================================================
# FINAL STATUS
# =============================================================================

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Service Status:"
echo "=================="
supervisorctl status

echo ""
echo "🌐 Service Health:"
echo "=================="
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

if pgrep nginx > /dev/null; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

echo ""
echo "✅ Your task management system is ready!"
echo "🚀 Access your application at the RunPod public URL"
echo ""
echo "💡 Troubleshooting commands:"
echo "  - supervisorctl status"
echo "  - tail -f /var/log/task-management-app.out.log"
echo "  - tail -f /var/log/ollama.out.log" 