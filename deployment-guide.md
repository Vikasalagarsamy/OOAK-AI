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