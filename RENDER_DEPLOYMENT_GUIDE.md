# OOAK Production Deployment on Render.com

## Overview
This guide will help you deploy your OOAK application to Render.com with proper database setup and domain configuration.

## Prerequisites
1. Render.com account
2. GitHub repository with your code
3. Domain names: `workspace.ooak.photography` and `api.ooak.photography`

## Step 1: Prepare Your Repository

### 1.1 Commit all changes to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2 Verify required files exist
- ✅ `render.yaml` - Render configuration
- ✅ `app/api/health/route.ts` - Health check endpoint
- ✅ `scripts/setup-render-database.js` - Database setup script
- ✅ Updated `next.config.js` - Production configuration
- ✅ Updated `package.json` - Dynamic port support

## Step 2: Create Render Services

### 2.1 Database Setup
1. Go to Render Dashboard → New → PostgreSQL
2. Configure:
   - **Name**: `ooak-database`
   - **Database Name**: `ooak_future_production`
   - **User**: `ooak_user`
   - **Plan**: Starter ($7/month)
3. Note down the connection details

### 2.2 Web Services Setup

#### Service 1: Employee Workspace
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `ooak-production`
   - **Environment**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month)

#### Service 2: WhatsApp API
1. Create another Web Service
2. Configure:
   - **Name**: `ooak-whatsapp-api`
   - **Environment**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month)

## Step 3: Environment Variables

### For Both Services, add these environment variables:

#### Database Connection
```
NODE_ENV=production
POSTGRES_HOST=[from database connection info]
POSTGRES_PORT=5432
POSTGRES_USER=ooak_user
POSTGRES_PASSWORD=[from database connection info]
POSTGRES_DATABASE=ooak_future_production
DATABASE_URL=[full connection string from database]
```

#### Service-Specific Variables

**For Employee Workspace (ooak-production):**
```
SERVICE_NAME=employee-workspace
PORT=3000
NEXT_PUBLIC_BASE_URL=[will be auto-generated]
```

**For WhatsApp API (ooak-whatsapp-api):**
```
SERVICE_NAME=whatsapp-automation
PORT=3000
NEXT_PUBLIC_BASE_URL=[will be auto-generated]
```

## Step 4: Custom Domains

### 4.1 Employee Workspace Domain
1. In `ooak-production` service settings
2. Go to Settings → Custom Domains
3. Add: `workspace.ooak.photography`

### 4.2 WhatsApp API Domain
1. In `ooak-whatsapp-api` service settings
2. Go to Settings → Custom Domains
3. Add: `api.ooak.photography`

### 4.3 DNS Configuration
Update your DNS provider (Cloudflare) with CNAME records:
```
workspace.ooak.photography → [render-provided-domain]
api.ooak.photography → [render-provided-domain]
```

## Step 5: Database Migration

### 5.1 Access Database
1. Go to your database in Render Dashboard
2. Use the "Connect" button to get connection details
3. Connect using a PostgreSQL client (like pgAdmin or psql)

### 5.2 Import Your Data
```bash
# Export from your local database
pg_dump -h localhost -U vikasalagarsamy -d ooak_future_production > production_backup.sql

# Import to Render database
psql [render-database-url] < production_backup.sql
```

## Step 6: Deployment

### 6.1 Deploy Services
1. Both services should auto-deploy when you push to GitHub
2. Monitor the build logs in Render Dashboard
3. Check health endpoints:
   - `https://workspace.ooak.photography/api/health`
   - `https://api.ooak.photography/api/health`

### 6.2 Verify Deployment
1. **Employee Workspace**: Visit `https://workspace.ooak.photography`
2. **WhatsApp API**: Visit `https://api.ooak.photography/api/health`
3. Check all functionality works correctly

## Step 7: Monitoring & Maintenance

### 7.1 Health Monitoring
- Render automatically monitors `/api/health` endpoint
- Set up alerts for service downtime
- Monitor database performance

### 7.2 Scaling
- Start with Starter plans ($7/month each)
- Upgrade to Standard plans if needed for more resources
- Database can be scaled independently

## Cost Breakdown
- **Database**: $7/month (Starter PostgreSQL)
- **Employee Workspace**: $7/month (Starter Web Service)
- **WhatsApp API**: $7/month (Starter Web Service)
- **Total**: $21/month

## Troubleshooting

### Common Issues
1. **Build Failures**: Check build logs for missing dependencies
2. **Database Connection**: Verify environment variables are correct
3. **CSS Issues**: Ensure Tailwind CSS is properly configured
4. **Port Issues**: Services should use PORT environment variable

### Debug Commands
```bash
# Check health endpoint
curl https://workspace.ooak.photography/api/health

# Check database connection
node scripts/setup-render-database.js
```

## Rollback Plan
If deployment fails:
1. Revert to previous GitHub commit
2. Redeploy from Render Dashboard
3. Restore database from backup if needed

## Next Steps
1. Set up automated backups
2. Configure monitoring and alerts
3. Set up staging environment
4. Implement CI/CD pipeline

---

📞 **Support**: If you encounter issues, check Render's documentation or contact their support team.
