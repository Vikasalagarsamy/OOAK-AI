# 🚀 Production Deployment Guide

## Phase 2: Production Optimization - Complete Implementation

This guide covers the deployment of the production-ready notification system with all optimizations, monitoring, and security features.

## 📋 **Pre-Deployment Checklist**

### 1. Database Optimization
- [ ] Run production optimization SQL script
- [ ] Enable Row Level Security (RLS)
- [ ] Create database indexes
- [ ] Set up archiving functions
- [ ] Configure backup strategy

### 2. Environment Configuration
- [ ] Set production environment variables
- [ ] Configure feature flags
- [ ] Set up monitoring credentials
- [ ] Configure allowed origins
- [ ] Set rate limiting parameters

### 3. Security Setup
- [ ] Enable authentication
- [ ] Configure CORS policies
- [ ] Set up API key authentication
- [ ] Enable request validation
- [ ] Configure SSL/TLS

### 4. Performance Configuration
- [ ] Set up caching layer (Redis recommended)
- [ ] Configure connection pooling
- [ ] Set performance thresholds
- [ ] Enable request batching
- [ ] Configure CDN (if applicable)

## 🗄️ **Database Setup**

### Step 1: Run Production Optimization Script

```sql
-- Execute the complete production optimization script
\i scripts/production-optimization.sql
```

### Step 2: Enable Row Level Security

```sql
-- Enable RLS for production
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Set up user context functions
SELECT set_config('app.current_user_id', '1', false);
SELECT set_config('app.current_user_role', 'Administrator', false);
```

### Step 3: Create Scheduled Jobs

```sql
-- Create daily maintenance job
SELECT cron.schedule('daily-maintenance', '0 2 * * *', 'SELECT run_maintenance();');

-- Create hourly archiving job
SELECT cron.schedule('hourly-archive', '0 * * * *', 'SELECT archive_old_notifications();');
```

## 🔧 **Environment Variables**

### Required Production Variables

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://username:password@host:5432/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Security
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
CRON_SECRET=your-cron-secret

# Performance & Caching
CACHE_ENABLED=true
CACHE_TTL=300
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMITING_ENABLED=true
RATE_LIMIT_READ=1000
RATE_LIMIT_WRITE=100

# Real-time Configuration
REALTIME_MAX_CONNECTIONS=1000
REALTIME_HEARTBEAT_INTERVAL=30000

# Notification Configuration
NOTIFICATION_BATCHING_ENABLED=true
NOTIFICATION_BATCH_WINDOW=300

# Security
ENABLE_RLS=true
REQUIRE_AUTH=true
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Monitoring
LOG_LEVEL=info
ERROR_RATE_THRESHOLD=5
HEALTH_CHECKS_ENABLED=true

# Feature Flags
FEATURE_ENHANCED_NOTIFICATIONS=true
FEATURE_REALTIME_V2=true
FEATURE_ADVANCED_BATCHING=true
FEATURE_AI_INSIGHTS=true
FEATURE_PERFORMANCE_METRICS=true
```

## 🔐 **Security Configuration**

### 1. API Authentication

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Check for API key on production routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const apiKey = request.headers.get('x-api-key')
    
    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
```

### 2. CORS Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || 'https://your-domain.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-API-Key'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

## 📊 **Monitoring & Observability**

### 1. Health Check Endpoint

```bash
# Check system health
curl -X HEAD https://your-domain.com/api/notifications/enhanced

# Expected headers:
# X-Health-Status: healthy
# X-Cache-Size: 150
# X-Rate-Limit-Clients: 25
```

### 2. Performance Monitoring

```typescript
// lib/monitoring.ts
export class ProductionMonitoring {
  static async logMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      activeConnections: getActiveConnections(),
      cacheHitRate: getCacheHitRate(),
      avgResponseTime: getAverageResponseTime()
    }
    
    // Send to monitoring service
    await sendToMonitoring(metrics)
  }
}
```

### 3. Error Tracking

```typescript
// lib/error-tracking.ts
export function captureError(error: Error, context?: any) {
  // Log locally
  console.error('Production Error:', error, context)
  
  // Send to error tracking service (e.g., Sentry)
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context })
  }
}
```

## 🚀 **Deployment Steps**

### 1. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NODE_ENV production
vercel env add DATABASE_URL [your-database-url]
# ... add all required environment variables
```

### 2. Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build and deploy
docker build -t notification-system .
docker run -p 3000:3000 --env-file .env.production notification-system
```

### 3. AWS/Azure/GCP Deployment

```yaml
# docker-compose.yml for cloud deployment
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis
      - postgres
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: notifications
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🧪 **Production Testing**

### 1. Load Testing

```bash
# Install Artillery for load testing
npm install -g artillery

# Run load tests
artillery quick --count 100 --num 10 https://your-domain.com/api/notifications/enhanced

# Expected results:
# - Response time: < 500ms (95th percentile)
# - Error rate: < 1%
# - Throughput: > 100 RPS
```

### 2. API Testing

```bash
# Test notification creation
curl -X POST https://your-domain.com/api/notifications/enhanced \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "user_id": 1,
    "type": "test",
    "title": "Production Test",
    "message": "Testing production API",
    "priority": "medium"
  }'

# Test notification fetching with filters
curl "https://your-domain.com/api/notifications/enhanced?priority=high&limit=10" \
  -H "X-API-Key: your-api-key"
```

### 3. Real-time Testing

```javascript
// test-realtime.js
const WebSocket = require('ws');

const testRealtime = () => {
  const ws = new WebSocket('wss://your-domain.com/_vercel/realtimeStream');
  
  ws.on('open', () => {
    console.log('✅ Real-time connection established');
    
    // Subscribe to notifications
    ws.send(JSON.stringify({
      event: 'phx_join',
      topic: 'notifications:production',
      payload: {},
      ref: 1
    }));
  });
  
  ws.on('message', (data) => {
    console.log('📡 Real-time message:', JSON.parse(data));
  });
  
  ws.on('error', (error) => {
    console.error('❌ Real-time error:', error);
  });
};

testRealtime();
```

## 📈 **Performance Benchmarks**

### Expected Performance Metrics

| Metric | Target | Monitoring |
|--------|--------|------------|
| API Response Time | < 500ms (95th percentile) | New Relic, DataDog |
| Real-time Latency | < 100ms | WebSocket monitoring |
| Database Query Time | < 200ms | Database logs |
| Memory Usage | < 512MB | System monitoring |
| CPU Usage | < 70% | System monitoring |
| Cache Hit Rate | > 80% | Redis monitoring |
| Error Rate | < 1% | Error tracking |
| Uptime | > 99.9% | Health checks |

## 🔧 **Maintenance & Operations**

### Daily Operations

```bash
# Check system health
curl -I https://your-domain.com/api/notifications/enhanced

# Monitor error logs
tail -f /var/log/notification-system/error.log

# Check database performance
psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

### Weekly Maintenance

```sql
-- Run database maintenance
SELECT run_maintenance();

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze notification patterns
SELECT 
  type,
  priority,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds
FROM notifications 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY type, priority
ORDER BY count DESC;
```

### Monthly Reviews

1. **Performance Review**
   - Analyze response time trends
   - Review error patterns
   - Check resource utilization

2. **Security Review**
   - Review access logs
   - Check for suspicious patterns
   - Update security configurations

3. **Capacity Planning**
   - Analyze growth trends
   - Plan for scaling needs
   - Review cost optimization

## 🚨 **Troubleshooting Guide**

### Common Issues

#### High Response Times
```bash
# Check database connections
SELECT count(*) FROM pg_stat_activity;

# Check cache performance
redis-cli info stats

# Check system resources
top -p $(pgrep node)
```

#### Real-time Connection Issues
```bash
# Check WebSocket connections
netstat -an | grep :3000

# Check Supabase real-time status
curl https://your-project.supabase.co/rest/v1/

# Test local real-time
node test-realtime.js
```

#### High Error Rates
```bash
# Check error logs
tail -n 100 /var/log/notification-system/error.log

# Check database errors
SELECT * FROM system_logs WHERE action = 'error' ORDER BY created_at DESC LIMIT 10;

# Check API errors
grep "ERROR" /var/log/nginx/access.log | tail -20
```

## 📞 **Support & Contact**

For production issues:
1. Check this documentation
2. Review system logs
3. Contact development team with:
   - Error messages
   - System metrics
   - Steps to reproduce

## 🎯 **Success Criteria**

✅ **Phase 2 Complete When:**
- [ ] All performance benchmarks met
- [ ] Security measures implemented
- [ ] Monitoring systems active
- [ ] Load testing passed
- [ ] Documentation complete
- [ ] Team trained on operations

🎊 **Congratulations! Your notification system is now production-ready with enterprise-grade features!** 