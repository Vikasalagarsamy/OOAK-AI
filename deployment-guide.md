# 🚀 Production Deployment Guide

## Overview
This guide covers deploying your Next.js wedding CRM application to your own server using Node.js with Supabase as the database.

## Prerequisites
- Linux server (Ubuntu 20.04+ recommended)
- Node.js 18+ installed
- PM2 process manager
- Nginx (for reverse proxy)
- SSL certificate (Let's Encrypt recommended)
- Domain name pointed to your server

## 1. Server Setup

### Install Node.js
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install PM2 Process Manager
```bash
npm install pm2 -g
```

### Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

## 2. Build Your Application

### On your local machine:
```bash
# Build the application
npm run build

# Create deployment package
tar -czf wedding-crm-build.tar.gz .next package.json package-lock.json public components lib app middleware.ts next.config.mjs tailwind.config.ts tsconfig.json

# Upload to your server
scp wedding-crm-build.tar.gz user@your-server:/var/www/
```

## 3. Server Deployment Structure

### Create application directory:
```bash
sudo mkdir -p /var/www/wedding-crm
sudo chown -R $USER:$USER /var/www/wedding-crm
cd /var/www/wedding-crm

# Extract build files
tar -xzf ../wedding-crm-build.tar.gz

# Install production dependencies only
npm ci --only=production
```

## 4. Environment Configuration

### Create production environment file:
```bash
# Create .env.production
nano .env.production
```

### Environment Variables (.env.production):
```env
NODE_ENV=production
PORT=3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Domain Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
```

## 5. PM2 Configuration

### Create PM2 ecosystem file:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'wedding-crm',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/wedding-crm',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    error_file: '/var/log/wedding-crm/error.log',
    out_file: '/var/log/wedding-crm/out.log',
    log_file: '/var/log/wedding-crm/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: ['--max-old-space-size=1024']
  }]
}
```

### Create log directory:
```bash
sudo mkdir -p /var/log/wedding-crm
sudo chown -R $USER:$USER /var/log/wedding-crm
```

### Start application with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 6. Nginx Configuration

### Create Nginx configuration:
```nginx
# /etc/nginx/sites-available/wedding-crm
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (after obtaining certificate)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files caching
    location /_next/static/ {
        alias /var/www/wedding-crm/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        alias /var/www/wedding-crm/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

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
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/wedding-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 7. SSL Certificate (Let's Encrypt)

### Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

### Obtain SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Auto-renewal:
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 8. Supabase Configuration

### Update Supabase Settings:
1. **Authentication Settings**:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/auth/callback`

2. **RLS Policies**: Ensure your Row Level Security policies allow your domain

3. **CORS Settings**: Add your domain to allowed origins if needed

## 9. Deployment Script

### Create deployment script:
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting deployment..."

# Stop PM2 application
pm2 stop wedding-crm

# Backup current build
if [ -d ".next" ]; then
    mv .next .next.backup.$(date +%Y%m%d_%H%M%S)
fi

# Extract new build
tar -xzf wedding-crm-build.tar.gz

# Install dependencies
npm ci --only=production

# Restart application
pm2 start wedding-crm

echo "✅ Deployment completed!"

# Show status
pm2 status
```

### Make executable:
```bash
chmod +x deploy.sh
```

## 10. Monitoring & Maintenance

### PM2 Monitoring:
```bash
# View logs
pm2 logs wedding-crm

# Monitor processes
pm2 monit

# Restart application
pm2 restart wedding-crm

# View status
pm2 status
```

### System Monitoring:
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
htop
```

### Backup Strategy:
```bash
# Create backup script
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "backup_$DATE.tar.gz" .next package.json .env.production
aws s3 cp "backup_$DATE.tar.gz" s3://your-backup-bucket/
```

## 11. Performance Optimization

### Enable Node.js Clustering:
```javascript
// In ecosystem.config.js
instances: 'max', // Uses all CPU cores
exec_mode: 'cluster'
```

### Database Connection Pooling:
- Supabase handles this automatically
- No additional configuration needed

### Caching Strategy:
- Static files cached by Nginx
- API responses can be cached using Redis if needed

## 12. Security Checklist

✅ SSL certificate installed and auto-renewing  
✅ Security headers configured in Nginx  
✅ Firewall configured (only ports 22, 80, 443 open)  
✅ Regular system updates scheduled  
✅ PM2 running as non-root user  
✅ Environment variables secured  
✅ Database access restricted by IP (optional)  

## 13. Troubleshooting

### Common Issues:

1. **Application won't start**:
   ```bash
   pm2 logs wedding-crm --lines 50
   ```

2. **502 Bad Gateway**:
   - Check if PM2 process is running
   - Verify port 3000 is accessible

3. **Database connection issues**:
   - Verify Supabase credentials
   - Check network connectivity

4. **Build issues**:
   - Ensure Node.js version compatibility
   - Check for missing dependencies

## Conclusion

This setup provides:
- ✅ **Production-ready** Next.js deployment
- ✅ **Supabase integration** working perfectly
- ✅ **SSL encryption** for security
- ✅ **Process management** with PM2
- ✅ **Reverse proxy** with Nginx
- ✅ **Monitoring** and logging
- ✅ **Auto-restart** on crashes
- ✅ **Scalable** clustering

Your application will be highly available, secure, and performant on your own server! 🎉 

# 🚀 AI SYSTEM DEPLOYMENT GUIDE

## 📋 **STEP-BY-STEP ACTIVATION**

### **STEP 1: Environment Variables**

Add these to your `.env.local` file:

```bash
# LOCAL LLM CONFIGURATION - Using your installed Qwen 2.5:7b
LLAMA_API_URL=http://localhost:11434/api/generate
LLAMA_MODEL=qwen2.5:7b
WHATSAPP_WEBHOOK_VERIFY_TOKEN=ooak_webhook_2025_secure

# Your existing variables remain the same:
# INTERAKT_API_KEY=already_configured
# NEXT_PUBLIC_SUPABASE_URL=already_configured
# etc...
```

### **STEP 2: Database Migration**

Run the database migration to create AI tables:

```bash
# Apply the new migration
npx supabase db push

# Or if using reset (WARNING: This will reset all data)
# npx supabase db reset --local
```

### **STEP 3: Your Local AI Models**

✅ **Perfect! You already have excellent models installed:**

```bash
# Your current models (ollama list):
qwen2.5:7b      ✅ RECOMMENDED - Best for structured JSON responses
llama3.1:8b     ✅ Alternative - Good general performance  
llama3:latest   ✅ Backup option
codellama:7b    ✅ Code-focused tasks
mistral:latest  ✅ Another strong option

# Ollama is already running! ✅
# No additional installation needed
```

### **STEP 4: Configure WhatsApp Webhooks**

In your Interakt dashboard, set webhook URL to:
```
https://yourdomain.com/api/whatsapp/webhook
```

### **STEP 5: Test the System**

1. **Approve a quotation** - Should create follow-up task
2. **Send test WhatsApp** - Should trigger AI analysis
3. **Check task dashboard** - Should show AI-generated tasks

## 🧪 **TESTING CHECKLIST**

### **Test 1: Post-Approval Workflow**
- [ ] Approve a quotation
- [ ] Verify WhatsApp message sent
- [ ] Check if follow-up task created
- [ ] Confirm lifecycle tracking initialized

### **Test 2: WhatsApp AI Analysis**
- [ ] Send webhook test message
- [ ] Verify message stored in database
- [ ] Check AI analysis triggered
- [ ] Confirm tasks generated

### **Test 3: API Endpoints**
- [ ] Test `/api/quotation-insights`
- [ ] Test `/api/whatsapp/webhook`
- [ ] Verify authentication working
- [ ] Check error handling

## 🔍 **VERIFICATION QUERIES**

Check if system is working with these database queries:

```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%whatsapp%' OR table_name LIKE '%ai_%';

-- Check follow-up tasks created
SELECT * FROM ai_communication_tasks 
ORDER BY created_at DESC LIMIT 5;

-- Check business lifecycle tracking
SELECT * FROM quotation_business_lifecycle 
ORDER BY created_at DESC LIMIT 5;
```

## 📊 **MONITORING & LOGS**

Monitor these logs for system health:

```bash
# Watch application logs
tail -f nextjs.log | grep -E "(AI|WhatsApp|🧠|📱|🤖)"

# Check for errors
grep -E "(ERROR|❌)" nextjs.log | tail -20
```

## 🎯 **SUCCESS INDICATORS**

System is working correctly when you see:

✅ **Post-Approval**: `✅ Post-approval follow-up task created`  
✅ **WhatsApp**: `📱 Processing incoming WhatsApp message`  
✅ **AI Analysis**: `🤖 Qwen 2.5 analysis completed for quotation`  
✅ **Task Creation**: `✅ Created X AI-recommended tasks`

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

1. **Qwen 2.5 Connection Error**
   - Ensure Ollama is running: `ollama serve` ✅ (Already running!)
   - Check model is available: `ollama list` ✅ (qwen2.5:7b found!)
   - Verify API URL: `http://localhost:11434/api/generate` ✅
   - Test model: `ollama run qwen2.5:7b "test"`

2. **WhatsApp Webhook Not Working**
   - Verify webhook URL configuration
   - Check webhook token matches
   - Test webhook manually

3. **Database Errors**
   - Ensure migration ran successfully
   - Check table permissions
   - Verify foreign key constraints

### **Debug Commands**

```bash
# Test Qwen 2.5 connection (YOUR MODEL)
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5:7b","prompt":"Hello, are you working?","stream":false}'

# Test database connection
npx supabase status

# Check webhook endpoint
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"message","direction":"inbound","from":"+919876543210","text":"Test message"}'

# Check Ollama status
ollama list
ps aux | grep ollama
```

## ✅ **DEPLOYMENT CHECKLIST**

- [x] Environment variables configured
- [ ] Database migration applied  
- [x] Local AI model ready (Qwen 2.5:7b) ✅
- [x] Ollama server running ✅
- [ ] Webhook URL configured
- [ ] System tested end-to-end
- [ ] Monitoring set up
- [ ] Team trained on new features

---

**🎉 You're 90% Ready! Your AI models are perfect and running!** 🚀 