# 🚀 RunPod Deployment Guide - Task Management System with Local LLM

This guide will help you deploy your task management system on RunPod with your own LLM hosted locally for maximum control and cost efficiency.

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│                    RunPod GPU Instance                  │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   Ollama LLM    │    │     Next.js Application    │ │
│  │   (Llama 3.1)   │◄──►│    (Task Management)       │ │
│  │   Port: 11434   │    │      Port: 3000            │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│           │                           │                 │
│           └─────────── Nginx ─────────┘                 │
│                       Port: 80/443                     │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  External Database  │
                    │    (Supabase)       │
                    │   PostgreSQL        │
                    └─────────────────────┘
```

## 📋 **Prerequisites**

### **RunPod Requirements**
- **GPU**: RTX 4090, A100, or similar (8GB+ VRAM recommended)
- **RAM**: 32GB+ recommended
- **Storage**: 100GB+ SSD
- **Template**: Ubuntu 22.04 with CUDA

### **External Services**
- **Database**: Supabase account (or PostgreSQL)
- **Domain**: Optional but recommended
- **SSL**: Let's Encrypt (automated in setup)

## 🎯 **Quick Deployment (Recommended)**

### **Option 1: One-Command Setup**

```bash
# Clone your repository
git clone <your-repo-url>
cd <your-repo-directory>

# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export DOMAIN="your-domain.com"  # Optional

# Run automated setup
chmod +x scripts/runpod-setup.sh
sudo bash scripts/runpod-setup.sh
```

### **Option 2: Docker Compose**

```bash
# Create directory and copy files
mkdir -p /opt/task-management-system
cd /opt/task-management-system

# Copy your application files
# (Upload via RunPod or git clone)

# Configure environment
cp .env.example .env.production
nano .env.production  # Edit with your values

# Deploy with Docker Compose
docker-compose -f docker/docker-compose.runpod.yml up -d

# Wait for services to be ready
docker-compose logs -f
```

## 🔧 **Manual Step-by-Step Setup**

### **Step 1: System Preparation**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and dependencies
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# Install NVIDIA Docker runtime
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L "https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list" | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update && sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker

# Verify GPU access
docker run --rm --gpus all nvidia/cuda:11.0-base-ubuntu20.04 nvidia-smi
```

### **Step 2: Deploy LLM Service**

```bash
# Start Ollama
docker run -d \
  --name ollama \
  --gpus all \
  -p 11434:11434 \
  -v ollama_data:/root/.ollama \
  -e OLLAMA_HOST=0.0.0.0 \
  ollama/ollama

# Wait for startup
sleep 30

# Pull models
docker exec ollama ollama pull llama3.1:8b
docker exec ollama ollama pull qwen2.5:7b

# Test LLM
curl http://localhost:11434/api/tags
```

### **Step 3: Deploy Application**

```bash
# Create application directory
sudo mkdir -p /opt/task-management-system
cd /opt/task-management-system

# Upload your code (via git or file transfer)
git clone <your-repo-url> .

# Configure environment
cat > .env.production << EOF
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LLM_ENDPOINT=http://localhost:11434
LLM_MODEL=llama3.1:8b
NODE_ENV=production
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOF

# Build and start application
docker build -f docker/Dockerfile.production -t task-management-app .
docker run -d \
  --name task-management-web \
  -p 3000:3000 \
  --env-file .env.production \
  --link ollama:ollama \
  task-management-app
```

### **Step 4: Configure Reverse Proxy**

```bash
# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/task-management << 'EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
    }

    location /api/llm/ {
        proxy_pass http://localhost:11434/;
        proxy_read_timeout 600;
        proxy_send_timeout 600;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/task-management /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 🔒 **Security Setup**

### **SSL Certificate (with domain)**

```bash
# Replace with your domain
DOMAIN="your-domain.com"

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN

# Verify auto-renewal
sudo crontab -l | grep certbot || echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### **Firewall Configuration**

```bash
# Configure UFW firewall
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw --force enable
```

## 📊 **Monitoring & Maintenance**

### **Health Monitoring**

```bash
# Check services status
docker ps
curl http://localhost:3000/api/health
curl http://localhost:11434/api/tags

# Monitor GPU usage
watch -n 5 nvidia-smi

# Check logs
docker logs ollama -f
docker logs task-management-web -f
```

### **Backup Script**

```bash
#!/bin/bash
# /opt/task-management-system/backup.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup models
docker run --rm -v ollama_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/models_$DATE.tar.gz -C /data .

# Backup application config
tar czf $BACKUP_DIR/app_config_$DATE.tar.gz /opt/task-management-system

echo "✅ Backup completed: $DATE"
```

## ⚡ **Performance Optimization**

### **LLM Optimization**

```bash
# For RTX 4090 (24GB VRAM)
export OLLAMA_MAX_LOADED_MODELS=2
export OLLAMA_MAX_QUEUE=4
export OLLAMA_NUM_PARALLEL=2

# For A100 (40GB VRAM)
export OLLAMA_MAX_LOADED_MODELS=3
export OLLAMA_NUM_PARALLEL=4
```

### **Application Optimization**

```dockerfile
# Add to Dockerfile for faster builds
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

## 🚨 **Troubleshooting**

### **Common Issues**

**GPU not detected:**
```bash
# Check NVIDIA drivers
nvidia-smi
docker run --rm --gpus all nvidia/cuda:11.0-base-ubuntu20.04 nvidia-smi
```

**Ollama not responding:**
```bash
# Restart Ollama
docker restart ollama
# Check logs
docker logs ollama
```

**Application errors:**
```bash
# Check app logs
docker logs task-management-web
# Restart app
docker restart task-management-web
```

**Memory issues:**
```bash
# Check memory usage
free -h
docker stats
# Clean up unused containers
docker system prune -a
```

## 💰 **Cost Optimization**

### **RunPod Cost Estimates**

| GPU Type | RAM | Storage | Cost/hour | Monthly* |
|----------|-----|---------|-----------|----------|
| RTX 4090 | 32GB | 100GB | $0.40 | ~$290 |
| RTX A5000 | 64GB | 200GB | $0.50 | ~$360 |
| A100 40GB | 80GB | 500GB | $1.20 | ~$870 |

*Approximate 24/7 usage

### **Cost Saving Tips**

1. **Auto-stop**: Configure auto-stop when idle
2. **Spot instances**: Use spot pricing for 50-70% savings
3. **Model optimization**: Use smaller models when possible
4. **Caching**: Implement response caching
5. **Load balancing**: Scale based on usage

## 🔄 **Updates & Scaling**

### **Application Updates**

```bash
# Update application
cd /opt/task-management-system
git pull origin main
docker build -f docker/Dockerfile.production -t task-management-app .
docker-compose restart task_management_app
```

### **Model Updates**

```bash
# Update models
docker exec ollama ollama pull llama3.1:8b
docker exec ollama ollama pull qwen2.5:7b
```

### **Horizontal Scaling**

For high-traffic scenarios:

1. **Load Balancer**: Use multiple RunPod instances
2. **Database**: Scale Supabase or use dedicated PostgreSQL
3. **CDN**: CloudFlare for static assets
4. **Caching**: Redis for API responses

## ✅ **Verification Checklist**

- [ ] RunPod instance started with GPU
- [ ] Docker and NVIDIA runtime installed
- [ ] Ollama running and models loaded
- [ ] Next.js application running
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed (if domain)
- [ ] Health checks passing
- [ ] Monitoring scripts active
- [ ] Backup scripts configured
- [ ] Firewall rules set

## 🎯 **Success Confirmation**

Your deployment is successful when:

1. **Application accessible** at your domain/IP
2. **LLM responding** to API calls
3. **Task generation working** with local LLM
4. **Database connected** and functioning
5. **All features working** as in development
6. **Performance metrics** showing healthy system

## 📞 **Support & Resources**

- **RunPod Documentation**: https://docs.runpod.io/
- **Ollama Documentation**: https://ollama.ai/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Docker GPU**: https://docs.docker.com/config/containers/resource_constraints/#gpu

---

**🚀 Your task management system with local LLM is now ready for production use on RunPod!** 