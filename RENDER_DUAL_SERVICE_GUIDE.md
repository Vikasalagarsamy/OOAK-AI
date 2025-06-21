# Render.com Dual Service Deployment Guide

## Problem Statement
You have **ONE repository** (`OOAK-AI`) that needs to serve **TWO different purposes**:
1. **Employee Workspace** (`workspace.ooak.photography`) - Full Next.js app for employees
2. **WhatsApp API** (`api.ooak.photography`) - API-only service for automation

## Solution: Same Repository, Different Configurations

### Step 1: Create WhatsApp API Service

In your Render dashboard, when creating the WhatsApp API service:

**Service Configuration:**
- **Name:** `ooak-whatsapp-api`
- **Repository:** `Vikasalagarsamy/OOAK-AI` (same repo!)
- **Branch:** `main`
- **Root Directory:** Leave empty (use root)
- **Runtime:** `Node`
- **Build Command:** `npm ci && npm run build:api`
- **Start Command:** `npm run start:api`

**Environment Variables:**
```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://api.ooak.photography
DATABASE_URL=[Connect to your ooak-database]
WHATSAPP_VERIFY_TOKEN=whatsapp_verify_123
OPENAI_API_KEY=[Your OpenAI key]
ANTHROPIC_API_KEY=[Your Anthropic key]
GROQ_API_KEY=[Your Groq key]
```

**Custom Domain:** `api.ooak.photography`

### Step 2: Update Employee Workspace Service

For your existing `ooak-production` service (fix the failed deployment):

**Service Configuration:**
- **Name:** `ooak-production` (keep existing)
- **Repository:** `Vikasalagarsamy/OOAK-AI` (same repo!)
- **Branch:** `main`
- **Root Directory:** Leave empty (use root)
- **Runtime:** `Node`
- **Build Command:** `npm ci && npm run build:workspace`
- **Start Command:** `npm run start:workspace`

**Environment Variables:**
```
NODE_ENV=production
PORT=4000
NEXT_PUBLIC_APP_URL=https://workspace.ooak.photography
DATABASE_URL=[Connect to your ooak-database]
WHATSAPP_VERIFY_TOKEN=whatsapp_verify_123
OPENAI_API_KEY=[Your OpenAI key]
ANTHROPIC_API_KEY=[Your Anthropic key]
GROQ_API_KEY=[Your Groq key]
```

**Custom Domain:** `workspace.ooak.photography`

## How This Works

### Different Build Commands = Different Applications

1. **`npm run build:api`** - Builds ONLY the API routes, optimized for automation
2. **`npm run build:workspace`** - Builds the FULL application with UI components

### Different Start Commands = Different Ports

1. **`npm run start:api`** - Starts on port 3000 (API focus)
2. **`npm run start:workspace`** - Starts on port 4000 (Full app)

### Same Database, Different Access Patterns

Both services connect to the same `ooak-database` but:
- **API Service:** Only handles webhook endpoints and automation
- **Workspace Service:** Provides full employee interface

## Deployment Steps

### 1. Deploy Database First
- Your `ooak-database` is already available ✅

### 2. Fix Employee Workspace
1. Go to your failed `ooak-production` service
2. Update build command to: `npm ci && npm run build:workspace`
3. Update start command to: `npm run start:workspace`
4. Add all environment variables listed above
5. Deploy

### 3. Create WhatsApp API Service
1. Click "New +" → "Web Service"
2. Select `Vikasalagarsamy/OOAK-AI` repository
3. Use configuration from Step 1 above
4. Add custom domain: `api.ooak.photography`
5. Deploy

## Final Architecture

```
📦 OOAK-AI Repository
├── 🌐 api.ooak.photography (WhatsApp API)
│   ├── Port: 3000
│   ├── Build: npm run build:api
│   ├── Focus: API endpoints only
│   └── Database: ooak-database
│
├── 🏢 workspace.ooak.photography (Employee App)
│   ├── Port: 4000
│   ├── Build: npm run build:workspace
│   ├── Focus: Full Next.js application
│   └── Database: ooak-database
│
└── 🗄️ ooak-database (PostgreSQL)
    └── Shared by both services
```

## Cost Breakdown
- **Database:** $7/month (shared)
- **WhatsApp API Service:** $7/month
- **Employee Workspace Service:** $7/month
- **Total:** $21/month

## Troubleshooting

### If Build Fails
1. Check that both services use the same repository
2. Verify build commands are correct
3. Ensure all environment variables are set
4. Check logs for specific errors

### If Domain Doesn't Work
1. Verify custom domain is added to correct service
2. Check DNS settings in Cloudflare
3. Wait for SSL certificate provisioning (can take 15 minutes)

### If Database Connection Fails
1. Ensure DATABASE_URL is connected to ooak-database
2. Check database is in same region (Oregon)
3. Verify database user permissions

## Next Steps After Deployment

1. **Test WhatsApp API:** `curl https://api.ooak.photography/api/health`
2. **Test Employee App:** Visit `https://workspace.ooak.photography`
3. **Update Interakt Webhook:** Point to `https://api.ooak.photography/api/webhooks/whatsapp`
4. **Monitor Logs:** Check both services are running correctly

## Key Insight 💡

**You DON'T need separate repositories!** The same codebase can serve different purposes with different build configurations. This is a common pattern in modern web development. 