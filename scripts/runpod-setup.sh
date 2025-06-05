#!/bin/bash

# RunPod Deployment Setup Script
# This script sets up the task management application with local LLM on RunPod

set -e

echo "🚀 Starting RunPod deployment setup..."

# =============================================================================
# CONFIGURATION
# =============================================================================

APP_NAME="task-management-system"
DOMAIN=${DOMAIN:-"your-runpod-instance.com"}
LLM_MODEL=${LLM_MODEL:-"llama3.1:8b"}
BACKUP_MODEL=${BACKUP_MODEL:-"qwen2.5:7b"}

# =============================================================================
# SYSTEM SETUP
# =============================================================================

echo "📦 Installing system dependencies..."
apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    htop \
    unzip

# Start Docker service
systemctl start docker
systemctl enable docker

echo "✅ System dependencies installed"

# =============================================================================
# NVIDIA DOCKER SETUP
# =============================================================================

echo "🔧 Setting up NVIDIA Docker runtime..."

# Install nvidia-container-toolkit if not present
if ! command -v nvidia-container-runtime &> /dev/null; then
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
    curl -s -L "https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list" | tee /etc/apt/sources.list.d/nvidia-docker.list
    apt-get update && apt-get install -y nvidia-container-toolkit
    systemctl restart docker
fi

echo "✅ NVIDIA Docker runtime configured"

# =============================================================================
# APPLICATION DEPLOYMENT
# =============================================================================

echo "📁 Setting up application directory..."
mkdir -p /opt/$APP_NAME
cd /opt/$APP_NAME

# Create environment file
echo "📝 Creating environment configuration..."
cat > .env.production << EOF
# Database Configuration
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# LLM Configuration
LLM_ENDPOINT=http://localhost:11434
LLM_MODEL=${LLM_MODEL}
LLM_PROVIDER=ollama

# Application Settings
NODE_ENV=production
NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-$(openssl rand -base64 32)}
NEXTAUTH_URL=https://${DOMAIN}

# Security
CORS_ORIGIN=https://${DOMAIN}
API_SECRET_KEY=${API_SECRET_KEY:-$(openssl rand -base64 32)}

# Monitoring
HEALTH_CHECK_SECRET=${HEALTH_CHECK_SECRET:-$(openssl rand -base64 16)}
EOF

echo "✅ Environment configuration created"

# =============================================================================
# DOCKER SERVICES STARTUP
# =============================================================================

echo "🐳 Starting Docker services..."

# Pull required images
docker pull ollama/ollama:latest
docker pull node:18-alpine

# Start services using docker-compose
docker-compose -f docker/docker-compose.runpod.yml --env-file .env.production up -d

echo "⏳ Waiting for services to be healthy..."

# Wait for Ollama to be ready
timeout=300
counter=0
while ! curl -s http://localhost:11434/api/tags > /dev/null; do
    if [ $counter -gt $timeout ]; then
        echo "❌ Timeout waiting for Ollama to start"
        exit 1
    fi
    echo "Waiting for Ollama... ($counter/$timeout)"
    sleep 5
    counter=$((counter + 5))
done

echo "✅ Ollama is ready"

# Pull LLM models
echo "📥 Downloading LLM models..."
curl -X POST http://localhost:11434/api/pull -d "{\"name\":\"$LLM_MODEL\"}"
curl -X POST http://localhost:11434/api/pull -d "{\"name\":\"$BACKUP_MODEL\"}"

echo "✅ LLM models downloaded"

# =============================================================================
# NGINX CONFIGURATION
# =============================================================================

echo "🔧 Configuring Nginx reverse proxy..."

cat > /etc/nginx/sites-available/$APP_NAME << 'EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

echo "✅ Nginx configured"

# =============================================================================
# MONITORING SETUP
# =============================================================================

echo "📊 Setting up monitoring..."

# Create monitoring script
cat > /opt/$APP_NAME/monitor.sh << 'EOF'
#!/bin/bash

# Health check script for task management system
check_service() {
    local service=$1
    local url=$2
    local name=$3
    
    if curl -s -f "$url" > /dev/null; then
        echo "✅ $name is healthy"
        return 0
    else
        echo "❌ $name is unhealthy"
        return 1
    fi
}

echo "🔍 System Health Check - $(date)"
echo "=================================="

# Check services
check_service "app" "http://localhost:3000/api/health" "Next.js Application"
check_service "llm" "http://localhost:11434/api/tags" "LLM Service (Ollama)"

# Check GPU
echo ""
echo "🖥️ GPU Status:"
nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits

# Check disk space
echo ""
echo "💾 Disk Usage:"
df -h /opt/$APP_NAME

echo ""
echo "✅ Health check completed"
EOF

chmod +x /opt/$APP_NAME/monitor.sh

# Create systemd service for monitoring
cat > /etc/systemd/system/task-management-monitor.service << EOF
[Unit]
Description=Task Management System Monitor
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/$APP_NAME/monitor.sh
User=root

[Install]
WantedBy=multi-user.target
EOF

# Create timer for regular monitoring
cat > /etc/systemd/system/task-management-monitor.timer << EOF
[Unit]
Description=Run Task Management Monitor every 5 minutes
Requires=task-management-monitor.service

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable task-management-monitor.timer
systemctl start task-management-monitor.timer

echo "✅ Monitoring setup completed"

# =============================================================================
# FINAL SETUP
# =============================================================================

echo "🔧 Final configuration..."

# Create backup script
cat > /opt/$APP_NAME/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Docker volumes
docker run --rm -v ollama_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/ollama_models_$DATE.tar.gz -C /data .

# Backup application config
cp -r /opt/task-management-system $BACKUP_DIR/app_config_$DATE

echo "✅ Backup completed: $DATE"
EOF

chmod +x /opt/$APP_NAME/backup.sh

# Set up log rotation
cat > /etc/logrotate.d/task-management << EOF
/opt/$APP_NAME/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

echo "✅ Backup and log rotation configured"

# =============================================================================
# COMPLETION
# =============================================================================

echo ""
echo "🎉 RunPod deployment completed successfully!"
echo ""
echo "📋 Service Status:"
echo "=================="
docker-compose -f docker/docker-compose.runpod.yml ps

echo ""
echo "🌐 Access URLs:"
echo "==============="
echo "Application: http://localhost:3000"
echo "LLM API: http://localhost:11434"
echo "Health Check: http://localhost:3000/api/health"

echo ""
echo "🔧 Management Commands:"
echo "======================"
echo "View logs: docker-compose -f docker/docker-compose.runpod.yml logs -f"
echo "Restart: docker-compose -f docker/docker-compose.runpod.yml restart"
echo "Monitor: /opt/$APP_NAME/monitor.sh"
echo "Backup: /opt/$APP_NAME/backup.sh"

echo ""
echo "✅ Your task management system is ready!"
echo "Remember to:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Set up SSL certificates with: certbot --nginx"
echo "3. Update your environment variables as needed"
echo "4. Test the application thoroughly"

echo ""
echo "🎯 Next steps:"
echo "- Access the application and verify all features work"
echo "- Set up automated backups"
echo "- Configure monitoring alerts"
echo "- Optimize model loading and performance" 