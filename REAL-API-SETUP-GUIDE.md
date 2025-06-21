# Real API Integration Guide - Universal AI System

## 🚀 Connect Your Universal AI to Live Platforms

Your system is **READY** to process real customer communications! Follow this guide to connect to live WhatsApp Business API, Instagram Business API, and other platforms.

---

## 📱 WHATSAPP BUSINESS API SETUP

### Step 1: Meta Developer Account Setup
1. **Go to**: https://developers.facebook.com/
2. **Create Account** or login with existing Facebook account
3. **Create New App** → Select "Business" → Continue
4. **App Name**: "YourBusiness Universal AI"
5. **Contact Email**: Your business email

### Step 2: WhatsApp Business API Configuration
1. **Add WhatsApp Product** to your app
2. **Get Phone Number**: 
   - Go to WhatsApp → Configuration
   - Add your business phone number
   - Verify with SMS code
3. **Get Required Credentials**:
   - `Phone Number ID`: Found in WhatsApp Configuration
   - `Business Account ID`: In WhatsApp settings
   - `Access Token`: Generate in App Settings → Basic

### Step 3: Webhook Configuration
1. **Webhook URL**: Use your public URL + `/api/webhooks/whatsapp`
   - **Local Development**: `https://your-ngrok-url.com/api/webhooks/whatsapp`
   - **Production**: `https://yourdomain.com/api/webhooks/whatsapp`

2. **Verify Token**: Create a custom token (e.g., `whatsapp_verify_123`)

3. **Subscribe to Events**:
   - ✅ messages
   - ✅ message_deliveries  
   - ✅ message_reads
   - ✅ message_reactions

### Step 4: Test WhatsApp Integration
```bash
# Test webhook verification
curl -X GET "https://your-domain.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test&hub.verify_token=whatsapp_verify_123"

# Send test message to your WhatsApp Business number
# Check your Universal AI dashboard for new leads
```

---

## 📸 INSTAGRAM BUSINESS API SETUP

### Step 1: Instagram Business Account
1. **Convert** your Instagram account to Business Account
2. **Connect** to a Facebook Page
3. **Verify** business information

### Step 2: Meta App Configuration  
1. **Add Instagram Basic Display** product to your app
2. **Configure Instagram Login**:
   - Valid OAuth Redirect URIs: `https://yourdomain.com/auth/instagram`
   - Deauthorize Callback URL: `https://yourdomain.com/auth/instagram/deauth`

### Step 3: Instagram Webhooks
1. **Webhook URL**: `https://yourdomain.com/api/webhooks/instagram`
2. **Verify Token**: Create custom token (e.g., `instagram_verify_456`)
3. **Subscribe to Events**:
   - ✅ messages
   - ✅ messaging_postbacks
   - ✅ messaging_optins
   - ✅ story_insights

### Step 4: Get Instagram Credentials
```javascript
// Required Environment Variables
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_APP_SECRET=your_instagram_app_secret  
INSTAGRAM_VERIFY_TOKEN=instagram_verify_456
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_id
```

---

## 🌐 PUBLIC WEBHOOK SETUP

### Option 1: ngrok (Development)
```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In new terminal, expose port 3001
ngrok http 3001

# Use the HTTPS URL: https://abc123.ngrok.io
```

### Option 2: Cloudflare Tunnel (Production)
```bash
# Install Cloudflare tunnel
npm install -g cloudflared

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create universal-ai

# Start tunnel
cloudflared tunnel --url http://localhost:3001
```

### Option 3: Deploy to Production
- **Vercel**: `npm run build && vercel --prod`
- **Netlify**: `npm run build && netlify deploy --prod`
- **Railway**: `railway up`

---

## ⚙️ ENVIRONMENT CONFIGURATION

Create `.env.production` file:

```bash
# Public webhook URL
PUBLIC_URL=https://your-production-domain.com

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=EAABwzLixnjYBO...
WHATSAPP_VERIFY_TOKEN=whatsapp_verify_123
WHATSAPP_PHONE_NUMBER_ID=120364...
WHATSAPP_BUSINESS_ACCOUNT_ID=102290...

# Instagram Business API  
INSTAGRAM_ACCESS_TOKEN=IGQVJXa1...
INSTAGRAM_APP_SECRET=abc123...
INSTAGRAM_VERIFY_TOKEN=instagram_verify_456
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841...

# Database (already configured)
DATABASE_URL=your_existing_database_url

# AI Processing
OPENAI_API_KEY=sk-... # If using OpenAI
```

---

## 🧪 TESTING REAL INTEGRATION

### 1. Test WhatsApp
```bash
# Run integration test
node webhook-tester.js whatsapp

# Or send real message to your WhatsApp Business number
# Check dashboard for new lead
```

### 2. Test Instagram  
```bash
# Test Instagram webhook
node webhook-tester.js instagram

# Or send DM to your Instagram Business account
# Check Universal AI response
```

### 3. Full System Test
```bash
# Complete integration test
node webhook-tester.js full

# Live demo with real data
node live-demo.js
```

---

## 📊 MONITOR LIVE PERFORMANCE

### Real-Time Dashboard
- **Access**: http://localhost:3001/dashboard
- **Monitor**: Live leads, communications, AI responses
- **Analytics**: Response times, conversion rates

### Webhook Monitoring
```bash
# Start webhook health monitoring
node setup-production-webhooks.js monitor

# Check webhook logs
tail -f logs/webhook.log
```

---

## 🚀 PRODUCTION DEPLOYMENT CHECKLIST

### Before Going Live:
- [ ] Meta Business verification completed
- [ ] WhatsApp Business number verified
- [ ] Instagram Business account connected
- [ ] Webhook URLs configured and tested
- [ ] SSL certificates installed
- [ ] Database backup created
- [ ] Monitoring alerts configured

### Launch Steps:
1. **Deploy** your app to production
2. **Update** webhook URLs in Meta console
3. **Test** with real messages
4. **Monitor** performance and error rates
5. **Scale** based on traffic

---

## 💡 QUICK START COMMANDS

```bash
# 1. Setup production webhooks
node setup-production-webhooks.js setup

# 2. Run integration tests  
node webhook-tester.js full

# 3. Start live demo
node live-demo.js

# 4. Deploy to production
npm run build && npm run start
```

---

## 🎯 SUCCESS METRICS

Once connected, your Universal AI will:
- ✅ **Process real customer messages** from WhatsApp/Instagram  
- ✅ **Generate leads automatically** with AI categorization
- ✅ **Provide instant business intelligence** across all channels
- ✅ **Track customer journeys** from first contact to conversion
- ✅ **Deliver actionable insights** with 100% confidence

---

## 🆘 SUPPORT & TROUBLESHOOTING

### Common Issues:
1. **Webhook verification failed**: Check verify token matches
2. **Messages not received**: Verify webhook subscription events
3. **Access token expired**: Regenerate long-lived tokens
4. **Rate limits**: Implement proper retry logic

### Get Help:
- **Meta Developer Docs**: https://developers.facebook.com/docs/whatsapp
- **Instagram API Docs**: https://developers.facebook.com/docs/instagram-basic-display-api
- **Test webhooks**: Use webhook-tester.js for debugging

---

**🎉 Your Universal AI System is ready to transform your business communications with real-time, intelligent processing across all platforms!** 