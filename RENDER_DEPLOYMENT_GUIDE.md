# 🚀 OOAK Future - Render.com Deployment Guide

## ✅ Prerequisites Complete
- ✅ Build successful (387 pages generated)
- ✅ Code pushed to GitHub: `https://github.com/Vikasalagarsamy/OOAK-AI.git`
- ✅ Render configuration ready (`render.yaml`)
- ✅ Production environment configured

## 🎯 Quick Deployment Steps

### 1. Access Render Dashboard
- Go to [https://render.com](https://render.com)
- Sign in with your GitHub account
- Click **"New +"** in the top right
- Select **"Blueprint"**

### 2. Connect Repository
- Choose **"Connect a repository"**
- Select: `Vikasalagarsamy/OOAK-AI`
- Render will automatically detect the `render.yaml` file
- Click **"Apply"**

### 3. Set Environment Variables
In the Render dashboard, add these environment variables:

```env
# AI Service Keys (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# WhatsApp (if using WhatsApp integration)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

### 4. Configure Custom Domains
- **Employee Workspace**: `workspace.ooak.photography`
- **WhatsApp API**: `api.ooak.photography`

In your domain provider (Cloudflare/GoDaddy/etc):
1. Add CNAME record: `workspace` → `ooak-production.onrender.com`
2. Add CNAME record: `api` → `ooak-whatsapp-api.onrender.com`

## 🏗️ Architecture Overview

### Services Deployed:
1. **Employee Workspace** (Port 4000)
   - Domain: `workspace.ooak.photography`
   - Features: Dashboard, CRM, Task Management, Reports
   - Database: PostgreSQL (shared)

2. **WhatsApp API** (Port 3000)
   - Domain: `api.ooak.photography`
   - Features: WhatsApp automation, Webhooks
   - Database: PostgreSQL (shared)

3. **PostgreSQL Database**
   - Name: `ooak_future_production`
   - Plan: Starter ($7/month)
   - Auto-backups enabled

## 💰 Pricing Breakdown
- **PostgreSQL Database**: $7/month
- **Employee Workspace Service**: $7/month
- **WhatsApp API Service**: $7/month
- **Total**: $21/month

## 🔧 Post-Deployment Setup

### 1. Database Initialization
Once deployed, the application will automatically:
- Create necessary database tables
- Set up initial data structures
- Configure user roles and permissions

### 2. First Login
- Access: `https://workspace.ooak.photography`
- Use your existing admin credentials
- The system will migrate existing data

### 3. Health Checks
Monitor these endpoints:
- `https://workspace.ooak.photography/api/health`
- `https://api.ooak.photography/api/health`

## 🚨 Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Verify all environment variables are set
- Ensure GitHub repository is accessible

### Database Connection Issues
- Verify DATABASE_URL is automatically set by Render
- Check database service is running
- Review connection pool settings

### Domain Not Working
- Verify DNS settings (can take up to 24 hours)
- Check SSL certificate status in Render
- Ensure domain is properly configured

## 🔍 Monitoring

### Key Metrics to Watch:
- Response time (should be < 2s)
- Memory usage (should stay under 512MB)
- Database connections
- Error rates

### Logs Access:
- Go to Render dashboard
- Select your service
- Click "Logs" tab
- Monitor real-time application logs

## 🔒 Security Features

### Automatic SSL
- Render provides free SSL certificates
- Automatic renewal
- HTTPS enforcement

### Environment Security
- Environment variables encrypted at rest
- Secure database connections
- Network isolation between services

## 📈 Scaling Options

### Vertical Scaling
- Upgrade to Standard plan for more resources
- Increase memory/CPU as needed

### Horizontal Scaling
- Add more service instances
- Load balancing automatically handled

## 🎉 Success Indicators

✅ **Deployment Successful When:**
- Both services show "Live" status
- Health checks return 200 OK
- Domains resolve correctly
- Application loads without errors
- Database connections established

## 📞 Support

If you encounter issues:
1. Check Render status page
2. Review deployment logs
3. Verify environment variables
4. Test database connectivity

---

**🚀 Your OOAK Future application is now production-ready on Render.com!**

**Live URLs:**
- Employee Workspace: https://workspace.ooak.photography
- WhatsApp API: https://api.ooak.photography
